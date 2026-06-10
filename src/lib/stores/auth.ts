import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, AthenaProfile, CommonCore } from "@/lib/types";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

interface AuthState {
  token: string | null;
  user: User | null;
  athena: AthenaProfile | null;
  commonCore: CommonCore | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  verify: () => Promise<boolean>;
  setUser: (user: User) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      athena: null,
      commonCore: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        try {
          const basic = btoa("ec684b8c687f479fad9d5e2cc6c6c456:");
          const response = await apiClient.post(
            API_ENDPOINTS.auth.token,
            {
              grant_type: "password",
              username,
              password,
            },
            {
              headers: {
                Authorization: `Basic ${basic}`,
              },
            }
          );

          const data = response.data;
          const token = data.access_token.replace("eg1~", "");

          set({
            token,
            isAuthenticated: true,
          });

          localStorage.setItem("splash.auth.token", token);

          await get().verify();
          return true;
        } catch {
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem("splash.auth.token");
        localStorage.removeItem("splash.auth.user");
        set({
          token: null,
          user: null,
          athena: null,
          commonCore: null,
          isAuthenticated: false,
        });
      },

      verify: async () => {
        const token = get().token;
        if (!token) return false;

        try {
          const response = await apiClient.get(API_ENDPOINTS.auth.verify, {
            headers: {
              Authorization: `Bearer eg1~${token}`,
            },
          });

          const data = response.data;
          const user: User = {
            accountId: data.account_id,
            displayName: data.display_name,
            banned: false,
          };

          set({
            user,
            isAuthenticated: true,
          });

          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: "splash-auth",
<<<<<<< HEAD
      storage: storage as any,
=======
      storage: createJSONStorage(() => localStorage),
>>>>>>> 6feae503997c688b92f634f49d5eb352a43ce471
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
