"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { WifiOff, RefreshCw, LogOut, Wrench } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useSessionStore } from "@/lib/stores/session";
import { useServerStatus } from "@/lib/stores/server-status";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/splash-endpoints";

const PING_INTERVAL = 15000;
const FAIL_THRESHOLD = 2;
const DISCORD_URL = "https://discord.gg/splash";

export default function ConnectionMonitor() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuthStore();
  const session = useSessionStore();
  const { maintenance, maintenanceMessage, setMaintenance } = useServerStatus();

  const [failCount, setFailCount] = useState(0);
  const [showDisconnect, setShowDisconnect] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const isLoggedIn = !!(session.token || auth.token);
  const isAuthPage = pathname === "/" || pathname === "/auth" || pathname === "/login";

  const checkStatus = useCallback(async () => {
    try {
      const res = await apiClient.get(endpoints.GET_LAUNCHER);
      const data = res.data;
      setMaintenance(!!data.maintenance, data.maintenanceMessage || "");
      setFailCount(0);
      setShowDisconnect(false);
    } catch {
      setFailCount(prev => {
        const next = prev + 1;
        if (next >= FAIL_THRESHOLD) setShowDisconnect(true);
        return next;
      });
    }
  }, [setMaintenance]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, PING_INTERVAL);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleRetry = async () => {
    setRetrying(true);
    await checkStatus();
    setRetrying(false);
  };

  const handleLogout = () => {
    auth.logout();
    session.setLogOut();
    router.push("/");
  };

  if (isAuthPage) return null;

  if (maintenance) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#05070a]/95 backdrop-blur-md flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-5">
            <Wrench className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Under Maintenance</h2>
          <p className="text-gray-400 text-sm mb-6">{maintenanceMessage || "The server is under maintenance. Check back soon."}</p>
          <div className="flex gap-3 justify-center">
            <a href={DISCORD_URL} target="_blank" rel="noreferrer"
              className="px-4 py-2 bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 rounded-lg text-sm hover:bg-[#5865F2]/30 transition-colors">
              Check Discord
            </a>
            <button onClick={handleLogout}
              className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-600/30 transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showDisconnect && isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center">
        <div className="bg-[#080a0f] border border-white/10 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Lost</h2>
          <p className="text-gray-400 text-sm mb-6">
            Lost connection to the Splash servers. Check your internet or the server may be down.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={handleRetry} disabled={retrying}
              className="w-full px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
              <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
              {retrying ? "Retrying…" : "Try Again"}
            </button>
            <a href={DISCORD_URL} target="_blank" rel="noreferrer"
              className="w-full px-4 py-2.5 bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 rounded-lg text-sm font-medium hover:bg-[#5865F2]/30 transition-colors">
              Check Server Status on Discord
            </a>
            <button onClick={handleLogout}
              className="w-full px-4 py-2.5 bg-red-600/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-600/20 transition-colors flex items-center justify-center gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
