import { create } from "zustand";

interface ServerStatusStore {
  maintenance: boolean;
  maintenanceMessage: string;
  setMaintenance: (on: boolean, message?: string) => void;
}

export const useServerStatus = create<ServerStatusStore>((set) => ({
  maintenance: false,
  maintenanceMessage: "",
  setMaintenance: (on, message = "") => set({ maintenance: on, maintenanceMessage: message }),
}));
