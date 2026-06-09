"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play, Users, Download, X } from "lucide-react";
import { useSessionStore } from "@/lib/stores/session";
import { useAuthStore } from "@/lib/stores/auth";
import Sidebar from "@/components/layout/Sidebar";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { endpoints } from "@/lib/api/splash-endpoints";

interface NewsItem {
  id: string;
  title: string;
  body: string;
  image: string;
}

interface LauncherStatus {
  playersOnline: number;
  activeLauncherUsers: number;
  version: string;
  status: string;
}

interface PlayerStats {
  level: number;
  xp: number;
  bookLevel: number;
  vBucks: number;
}

interface Friend {
  id: string;
  username: string;
  status: "online" | "playing" | "away" | "offline";
  location?: string;
}

interface Commit {
  id: string;
  message: string;
  author: string;
  date: string;
  url: string;
  repo?: string;
}

export default function HomePage() {
  const router = useRouter();
  const session = useSessionStore();
  const legacyAuth = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem("splash.auth.user");
      if (raw) return JSON.parse(raw);
    } catch {
    }
    return null;
  };

  const user = mounted ? (session.user || legacyAuth.user || getStoredUser()) : null;
  const athena = session.athena;
  const commonCore = session.common_core || legacyAuth.commonCore;
  const [status, setStatus] = useState<LauncherStatus>({
    playersOnline: 0,
    activeLauncherUsers: 0,
    version: "1.0.0",
    status: "online",
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState<PlayerStats>({
    level: 0,
    xp: 0,
    bookLevel: 0,
    vBucks: 0,
  });
  useEffect(() => {
    setStats({
      level: athena?.level ?? 0,
      xp: athena?.xp ?? 0,
      bookLevel: athena?.book_level ?? 0,
      vBucks: commonCore?.vBucks ?? 0,
    });
  }, [athena, commonCore]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.launcher.status);
        setStatus(res.data);
      } catch {
      }
    };

    const fetchNews = async () => {
      try {
        const res = await apiClient.get(API_ENDPOINTS.launcher.news);
        setNews(res.data.news || []);
      } catch {
        setNews([]);
      }
    };

    const fetchFriends = async () => {
      try {
        const accountId = user?.accountId;
        if (!accountId) return;
        const res = await apiClient.get(`/friends/api/public/friends/${accountId}`);
        const data = res.data || [];
        const mapped: Friend[] = data.map((f: any) => ({
          id: f.accountId || f.id,
          username: f.displayName || f.username || "Unknown",
          status: f.status || "offline",
          location: f.location,
        }));
        setFriends(mapped);
      } catch {
        setFriends([]);
      }
    };

    fetchStatus();
    fetchNews();
    fetchFriends();

    const checkForUpdate = async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (update?.available) {
          setUpdateAvailable(true);
          setUpdateVersion(update.version ?? "");
        }
      } catch {}
    };
    checkForUpdate();

    const fetchCommits = async () => {
      try {
        const res = await apiClient.get(endpoints.GET_COMMITS);
        setCommits(res.data.commits || []);
      } catch {
      }
    };

    fetchCommits();

    const streamUrl = `${endpoints.GET_COMMITS_STREAM}`;
    const sse = new EventSource(streamUrl);
    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setCommits(data.commits || []);
      } catch {
      }
    };
    sse.onerror = () => {
      sse.close();
      fetchCommits();
    };

    const heartbeat = async () => {
      if (user?.accountId) {
        try {
          await apiClient.post("/launcher/heartbeat", { accountId: user.accountId });
        } catch {
        }
      }
    };

    heartbeat();

    const interval = setInterval(() => {
      fetchStatus();
      fetchFriends();
      heartbeat();
    }, 15000);
    return () => {
      clearInterval(interval);
      sse.close();
    };
  }, [user?.accountId]);

  const heroNews = news[0] ?? { title: "Welcome to Splash", body: "A custom Fortnite private server experience built for the community.", image: "/news.png" };

  return (
    <div className="flex h-screen bg-[#05070a] text-white overflow-hidden">
      <Sidebar />

      <motion.main
        className="flex-1 flex flex-col overflow-y-auto"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {updateAvailable && !updateDismissed && (
          <div className="flex items-center justify-between px-5 py-2.5 bg-cyan-500/10 border-b border-cyan-500/20 text-sm">
            <div className="flex items-center gap-2 text-cyan-300">
              <Download className="w-4 h-4 shrink-0" />
              <span>Update available — <strong>v{updateVersion}</strong>. Restart to install.</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    setUpdating(true);
                    const { check } = await import("@tauri-apps/plugin-updater");
                    const update = await check();
                    if (update?.available) await update.downloadAndInstall();
                  } catch { setUpdating(false); }
                }}
                disabled={updating}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors"
              >
                {updating ? "Installing…" : "Install Now"}
              </button>
              <button onClick={() => setUpdateDismissed(true)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center px-6 pt-5 pb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {(() => {
                const h = new Date().getHours();
                return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
              })()}, <span className="text-cyan-400">{user?.displayName || user?.username || "Player"}</span>!
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{status.activeLauncherUsers ?? 0} Players Online</p>
          </div>

          <div className="rounded-xl bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 shadow-lg p-3 w-60">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
                  {(user as any)?.avatar ? (
                    <img src={(user as any).avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-black">
                      {(user?.displayName || user?.username || "P").charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[#05070a]" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-medium text-white text-xs">
                  {user?.displayName || user?.username || "Player"}
                </h3>
                <span className="text-[11px] text-gray-400">Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <div className="relative h-[200px] overflow-hidden rounded-xl shadow-lg group cursor-pointer" onClick={() => router.push("/library")}>
              <div className="absolute inset-0">
                <img
                  src={heroNews.image}
                  alt={heroNews.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/news.png";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              <div className="absolute bottom-3 right-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/library");
                  }}
                  className="w-12 h-12 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all hover:scale-110"
                >
                  <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                </button>
              </div>

              <div className="absolute bottom-3 left-4 max-w-[70%]">
                <h2 className="text-sm font-bold text-white truncate">
                  {heroNews.title}
                </h2>
                <p className="text-[11px] text-gray-300/80 line-clamp-1">
                  {heroNews.body}
                </p>
              </div>
          </div>
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 shadow-lg rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-300" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                Launcher Updates
              </h2>
              {commits.length === 0 ? (
                <div className="flex items-center justify-center h-24 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-xs text-gray-500">No updates yet — push a commit to see activity</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {commits.map((commit) => (
                    <a
                      key={commit.id}
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg bg-white/5 hover:bg-white/[0.08] transition-all border border-white/5 block"
                    >
                      <p className="text-[10px] text-gray-500 mb-1">
                        {new Date(commit.date).toLocaleString("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })}
                        {commit.repo ? ` · ${commit.repo}` : ""}
                      </p>
                      <h3 className="font-semibold text-xs text-white truncate mb-1">{commit.message}</h3>
                      <p className="text-[10px] text-gray-400">by {commit.author}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full lg:w-[280px] space-y-3">
              <div className="bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 shadow-lg rounded-xl p-4">
                <h2 className="text-sm font-semibold text-cyan-400 mb-2">Status</h2>
                <div className="bg-white/[0.03] rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        status.status === "online"
                          ? "bg-green-400"
                          : status.status === "maintenance"
                          ? "bg-yellow-400"
                          : "bg-red-400"
                      }`}
                    />
                    <span className="text-[11px] text-gray-400 uppercase tracking-wider">
                      {status.status}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">{status.playersOnline}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">players in-game</p>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
                  <Users className="w-3 h-3 text-cyan-400" />
                  <span>{status.activeLauncherUsers ?? 0} active in launcher</span>
                </div>
              </div>

              <div className="bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 shadow-lg rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Friends
                  </h2>
                  <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-md">
                    {friends.length} online
                  </span>
                </div>
                {friends.length > 0 ? (
                  <div className="space-y-2">
                    {friends.slice(0, 4).map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all"
                      >
                        <div className="relative">
                          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-cyan-400/30 to-emerald-400/30 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-cyan-300">
                              {friend.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#080a0f] ${
                              friend.status === "playing"
                                ? "bg-emerald-400"
                                : friend.status === "online"
                                ? "bg-green-400"
                                : friend.status === "away"
                                ? "bg-yellow-400"
                                : "bg-gray-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">
                            {friend.username}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {friend.status === "playing" && friend.location
                              ? `Playing ${friend.location}`
                              : friend.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-gray-500">
                    <Users className="w-6 h-6 mb-1.5 opacity-30" />
                    <span className="text-[11px]">No friends online</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}