import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthResponse } from "@/lib/types/auth";
import { generateAccountResponse } from "@/lib/api/discord-oauth";
import { checkState } from "@/lib/api/verify-session";

interface Storage {
  key: string;
  defaultValue: string;
}

interface SessionData {
  token: string;
  user: AuthResponse["user"] | null;
  hype: AuthResponse["hype"] | null;
  athena: AuthResponse["athena"] | null;
  common_core: AuthResponse["common_core"] | null;
}

interface SessionActions {
  login: (code: string) => Promise<boolean>;
  setToken: (token: string, user?: AuthResponse["user"] | null) => void;
  logout: () => void;
  verify: () => Promise<boolean>;
  setUser: (user: AuthResponse["user"]) => void;
  setLogOut: () => void;
  setAvatar: (avatar: string) => void;
}

type SessionStore = SessionData & SessionActions;

const STORAGE_CONFIG = {
  token: { key: "splash.auth.token", defaultValue: "" },
  athena: { key: "splash.auth.athena", defaultValue: "" },
  user: { key: "splash.auth.user", defaultValue: "" },
  hype: { key: "splash.auth.hype", defaultValue: "" },
  common_core: { key: "splash.auth.common_core", defaultValue: "" },
} as const;

const storage = {
  get: ({ key, defaultValue }: Storage): string => {
    if (typeof window === "undefined") return defaultValue;
    return localStorage.getItem(key) || defaultValue;
  },
  parse: <T>(config: Storage): T | null => {
    try {
      return JSON.parse(storage.get(config)) as T;
    } catch {
      return null;
    }
  },
  set: (key: string, value: unknown): void => {
    localStorage.setItem(
      key,
      typeof value === "string" ? value : JSON.stringify(value)
    );
  },
  remove: (key: string): void => {
    localStorage.removeItem(key);
  },
};

const getInitState = (): SessionData => {
  const user = storage.parse<AuthResponse["user"]>(STORAGE_CONFIG.user);
  return {
    token: storage.get(STORAGE_CONFIG.token),
    user,
    hype: storage.parse(STORAGE_CONFIG.hype),
    athena: storage.parse(STORAGE_CONFIG.athena),
    common_core: storage.parse(STORAGE_CONFIG.common_core),
  };
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      ...getInitState(),

      login: async (code: string): Promise<boolean> => {
        const response = await generateAccountResponse(code);
        if (!response.success) return false;

        const { user, athena, common_core } = response.data;

        storage.set(STORAGE_CONFIG.token.key, code);
        storage.set(STORAGE_CONFIG.athena.key, athena);
        storage.set(STORAGE_CONFIG.user.key, user);
        storage.set(STORAGE_CONFIG.common_core.key, common_core);
        storage.set(STORAGE_CONFIG.hype.key, response.data.hype);

        set({
          token: code,
          athena,
          user,
          common_core,
        });

        return true;
      },

      setToken: (token: string, user?: AuthResponse["user"] | null) => {
        storage.set(STORAGE_CONFIG.token.key, token);
        if (user) storage.set(STORAGE_CONFIG.user.key, user);
        set({
          token,
          user: user || get().user,
        });
      },

      logout: () => {
        try {
          Object.values(STORAGE_CONFIG).forEach(({ key }) =>
            storage.remove(key)
          );
          set({
            token: STORAGE_CONFIG.token.defaultValue,
            athena: null,
            user: null,
            common_core: null,
          });
        } catch (error) {
          console.error("Error during logout:", error);
        }
      },

      verify: async (): Promise<boolean> => {
        const response = await checkState(get().token);
        if (!response.success) {
          get().logout();
          return false;
        }
        return true;
      },

      setUser: (user: AuthResponse["user"]): void => {
        localStorage.setItem(
          STORAGE_CONFIG.user.key,
          JSON.stringify(user)
        );
        set({ user });
      },

      setLogOut: (): void => {
        set({ token: "" });
      },

      setAvatar: (avatar: string): void => {
        const user = get().user;
        if (!user) return;
        const updated = { ...user, avatar };
        storage.set(STORAGE_CONFIG.user.key, updated);
        set({ user: updated });
      },
    }),
    {
      name: "splash-session",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        athena: state.athena,
        common_core: state.common_core,
      }),
    }
  )
);

export default useSessionStore;
