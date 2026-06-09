"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { endpoints } from "@/lib/api/splash-endpoints";
import { apiClient } from "@/lib/api/client";
import { useSessionStore } from "@/lib/stores/session";
import FlowParticles from "@/components/auth/flow-particles";
import { listen } from "@tauri-apps/api/event";

export default function RegisterPage() {
  const router = useRouter();
  const session = useSessionStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupDeepLink = async () => {
      unlisten = await listen<string>("deep-link", async (event) => {
        const url = event.payload;
        const urlObj = new URL(url.replace("splash://", "http://localhost/"));
        const code = urlObj.searchParams.get("code");

        if (!code) return;

        try {
          const response = await apiClient.get("/api/auth/discord/callback", {
            params: { code },
          });
          const data = response.data;

          const user = data.user
            ? {
                accountId: data.user.id || "",
                displayName: data.user.username || "",
                email: data.user.email || "",
                banned: false,
                profilePicture: data.user.avatar || "",
                discordId: "",
                roles: [],
              }
            : null;

          session.setToken(data.token, user);
          router.push("/home");
        } catch {
          setError("Discord authentication failed.");
        }
      });
    };

    setupDeepLink();

    return () => {
      if (unlisten) unlisten();
    };
  }, [router, session]);

  const startDiscordOAuth = async () => {
    try {
      const res = await fetch(endpoints.GET_DISCORD_URI);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to get Discord OAuth URL.");
      }
    } catch {
      setError("Failed to start Discord OAuth.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !password || !confirmPassword) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      setError("Username can only contain letters, numbers, periods, and underscores");
      setIsLoading(false);
      return;
    }

    if (username.length < 3 || username.length > 16) {
      setError("Username must be between 3 and 16 characters");
      setIsLoading(false);
      return;
    }

    try {
      const formattedEmail = `${username.toLowerCase()}@splash.fn`;
      const hwid = `hwid-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const authToken = `auth-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const response = await apiClient.post("/api/auth/register", {
        username,
        email: formattedEmail,
        password,
        hwid,
        authToken,
      });

      const data = response.data;

      if (remember) {
        localStorage.setItem("savedUsername", username);
      }

      const user = data.user
        ? {
            accountId: data.user.id || "",
            displayName: data.user.username || "",
            email: data.user.email || "",
            banned: false,
            profilePicture: "",
            discordId: "",
            roles: [],
          }
        : null;

      session.setToken(data.token, user);
      router.push("/home");
    } catch (err: any) {
      let message = err.response?.data?.error || err.message || "An error occurred during registration";
      if (err.message === "Network Error") {
        message = "Cannot connect to backend. Make sure it's running on port 3551.";
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

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
            Create Account
          </h1>

          <form
            onSubmit={handleSubmit}
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
              <p className="text-xs text-gray-500 mt-1">
                Your email will be: {username ? username.toLowerCase() + "@splash.fn" : "username@splash.fn"}
              </p>
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

            <div className="flex flex-col relative">
              <label className="text-sm text-gray-300">Confirm Password</label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full mt-1 px-4 py-3 bg-neutral-900/90 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 w-6 h-6 flex items-center justify-center text-gray-300 cursor-pointer"
              >
                {showConfirmPassword ? (
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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold text-white flex justify-center items-center gap-2 disabled:opacity-50 transition"
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
              Sign up with Discord
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
                onClick={() => router.push("/")}
                className="underline hover:text-white transition"
              >
                Already have an account? Login
              </button>
            </div>
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
