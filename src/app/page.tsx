"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Loader2,
  LogIn,
  Download,
  RefreshCcw,
  AlertCircle,
  Eye,
  EyeOff,

} from "lucide-react";
import { endpoints } from "@/lib/api/splash-endpoints";
import { useSessionStore } from "@/lib/stores/session";
import { useAuthStore } from "@/lib/stores/auth";
import FlowParticles from "@/components/auth/flow-particles";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { open } from "@tauri-apps/plugin-shell";
import { apiClient } from "@/lib/api/client";

export default function LoginPage() {
  const session = useSessionStore();
  const legacyAuth = useAuthStore();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("checking");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateDetails, setUpdateDetails] = useState({
    version: "1.0.0",
    notes: "Splash Launcher v1.0.0 - Initial Release",
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const startDiscordOAuth = async () => {
    const state = `splash_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    setIsConnected(true);
    setError("");

    try {
      const res = await fetch(`${endpoints.GET_DISCORD_URI}?state=${state}`);
      const data = await res.json();
      if (!data.url) {
        setError("Failed to get Discord OAuth URL.");
        setIsConnected(false);
        return;
      }

      await open(data.url);

      let attempts = 0;
      const maxAttempts = 60;
      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > maxAttempts) {
          clearInterval(pollInterval);
          setError("Discord authentication timed out.");
          setIsConnected(false);
          return;
        }

        try {
          const pollRes = await fetch(
            `${endpoints.GET_BASE_URL}/api/auth/discord/poll?state=${state}`
          );
          const pollData = await pollRes.json();

          if (pollData.ready) {
            clearInterval(pollInterval);

            const user = pollData.user
              ? {
                  accountId: pollData.user.id || "",
                  displayName: pollData.user.username || "",
                  email: pollData.user.email || "",
                  banned: false,
                  profilePicture: pollData.user.avatar || "",
                  discordId: "",
                  roles: [],
                }
              : null;

            session.setToken(pollData.token, user);
            setTimeout(() => {
              window.location.href = "/home";
            }, 500);
          }
        } catch {
        }
      }, 2000);
    } catch {
      setError("Failed to start Discord OAuth.");
      setIsConnected(false);
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check();

        if (update) {
          setUpdateStatus("downloading");
          setUpdateDetails({
            version: update.version,
            notes: update.body ?? "",
          });

          let downloaded = 0;
          let contentLength = 0;

          await update.downloadAndInstall(async (event) => {
            switch (event.event) {
              case "Started":
                contentLength = event.data.contentLength ?? 0;
                break;
              case "Progress":
                downloaded += event.data.chunkLength;
                const progress = (downloaded / contentLength) * 100;
                setDownloadProgress(progress);
                break;
              case "Finished":
                setUpdateStatus("restarting");
                await relaunch();
                break;
            }
          });
        } else {
          setUpdateStatus("up-to-date");
        }
      } catch {
        setUpdateStatus("up-to-date");
      }
    };

    checkForUpdates();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const success = await legacyAuth.login(username, password);
    setIsLoading(false);

    if (success) {
      setIsConnected(true);
      setTimeout(() => {
        window.location.href = "/home";
      }, 1000);
    } else {
      setError("Invalid username or password");
    }
  };

  const renderUpdateStatus = () => {
    return (
      <AnimatePresence mode="wait">
        {updateStatus === "checking" && (
          <motion.div
            key="checking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mt-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-cyan-500/20 p-2 rounded-full">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  Checking for updates
                </h3>
                <p className="text-xs text-white/60">
                  Please wait while we check for the latest version
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {updateStatus === "downloading" && (
          <motion.div
            key="downloading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mt-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-500/20 p-2 rounded-full">
                <Download className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  Downloading update {updateDetails.version}
                </h3>
                <p className="text-xs text-white/60">{updateDetails.notes}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <p className="text-xs text-right text-white/60">
                {downloadProgress.toFixed(1)}% complete
              </p>
            </div>
          </motion.div>
        )}

        {updateStatus === "restarting" && (
          <motion.div
            key="restarting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mt-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-full">
                <RefreshCcw className="h-5 w-5 animate-spin text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  Restarting application
                </h3>
                <p className="text-xs text-white/60">
                  Update installed successfully
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {updateStatus === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full mt-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-500/20 p-2 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  Update check failed
                </h3>
                <p className="text-xs text-white/60">Please try again later</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (updateStatus === "checking") {
    return (
      <div className="flex min-h-screen relative select-none overflow-hidden bg-[#05070a] items-center justify-center">
        <FlowParticles className="absolute inset-0" quantity={250} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 w-80 p-8 rounded-xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-lg flex flex-col items-center justify-center text-center"
        >
          <img
            src="/splashlogo.png"
            alt="Splash Logo"
            className="h-20 w-auto object-contain drop-shadow-lg mb-6"
          />
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-4" />
          <p className="text-white font-medium">Checking for updates...</p>
          <p className="text-xs text-gray-400 mt-2">
            Please wait while we verify the latest version
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative select-none overflow-hidden bg-[#05070a]">
      <FlowParticles className="absolute inset-0" quantity={250} />

      <div className="w-[460px] h-screen bg-black/80 backdrop-blur-xl border-r border-white/10 flex flex-col justify-start px-10 py-10 z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col flex-1"
        >
          <div className="flex justify-center mb-6">
            <img
              src="/splashlogo.png"
              alt="Splash Logo"
              className="h-20 w-auto object-contain drop-shadow-lg"
            />
          </div>

          <h1 className="text-3xl font-bold mb-6 text-white text-center">
            Sign In
          </h1>

          <form
            onSubmit={handlePasswordSubmit}
            className="flex flex-col gap-5 flex-1"
          >
            <div className="flex flex-col">
              <label className="text-sm text-gray-300">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full mt-1 px-4 py-3 bg-neutral-900/90 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
              />
            </div>

            <div className="flex flex-col relative">
              <label className="text-sm text-gray-300">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full mt-1 px-4 py-3 bg-neutral-900/90 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 w-6 h-6 flex items-center justify-center text-gray-300 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <label className="flex items-center text-gray-300 text-sm gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="accent-cyan-500"
              />
              Remember Me
            </label>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-400/30 rounded-lg p-2">
                {error}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-white flex justify-center items-center gap-2 disabled:opacity-50 transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </motion.button>

            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-600" />
              <span className="text-xs text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-600" />
            </div>

            <motion.button
              type="button"
              onClick={startDiscordOAuth}
              disabled={!isReady || isConnected}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-white flex justify-center items-center gap-2 disabled:opacity-50 transition"
            >
              <AnimatePresence mode="wait">
                {!isReady ? (
                  <motion.div
                    key="verifying"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center"
                  >
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Verifying
                  </motion.div>
                ) : isConnected ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center"
                  >
                    Connected
                    <CheckCircle className="ml-2 h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="connect"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="mr-2"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                    Sign in with Discord
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <div className="flex justify-between text-sm mt-2 text-gray-300">
              <button
                type="button"
                className="underline text-gray-500 cursor-not-allowed transition"
                disabled
              >
                Check Out The Server?
              </button>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="underline hover:text-white transition"
              >
                Create Account
              </button>
            </div>

            {renderUpdateStatus()}
          </form>
        </motion.div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}