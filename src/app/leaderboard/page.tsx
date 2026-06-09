"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, TrendingUp, Wallet, Crown, Medal } from "lucide-react";
import { useSessionStore } from "@/lib/stores/session";
import { useAuthStore } from "@/lib/stores/auth";
import Sidebar from "@/components/layout/Sidebar";
import { apiClient } from "@/lib/api/client";

interface PlayerStats {
  level: number;
  xp: number;
  bookLevel: number;
  vBucks: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  accountId: string;
  level: number;
  xp: number;
  wins: number;
  kills: number;
}

export default function LeaderboardPage() {
  const session = useSessionStore();
  const legacyAuth = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<PlayerStats>({ level: 0, xp: 0, bookLevel: 0, vBucks: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"xp" | "wins" | "kills">("xp");

  useEffect(() => { setMounted(true); }, []);

  const user = mounted ? (session.user || legacyAuth.user) : null;
  const athena = session.athena;
  const commonCore = session.common_core || legacyAuth.commonCore;

  useEffect(() => {
    setStats({
      level: athena?.level ?? 0,
      xp: athena?.xp ?? 0,
      bookLevel: athena?.book_level ?? 0,
      vBucks: commonCore?.vBucks ?? 0,
    });
  }, [athena, commonCore]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await apiClient.get(`/leaderboard?type=${activeTab}`);
        setLeaderboard(res.data.leaderboard || []);
      } catch {
        setLeaderboard([]);
      }
    };
    fetchLeaderboard();
  }, [activeTab]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-gray-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return <span className="text-xs text-gray-500 font-mono w-4 text-center">#{rank}</span>;
  };

  return (
    <div className="flex h-screen bg-[#05070a] text-white overflow-hidden">
      <Sidebar />
      <motion.main
        className="flex-1 flex flex-col overflow-y-auto"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="px-6 pt-5 pb-2">
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-cyan-500/20 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">Level</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.level}</p>
              <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full"
                  style={{ width: `${Math.min((stats.xp % 10000) / 10000 * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">XP</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.xp.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500 mt-1">total earned</p>
            </div>
            <div className="bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-purple-500/20 flex items-center justify-center">
                  <Trophy className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">Battle Pass</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.bookLevel}</p>
              <p className="text-[10px] text-gray-500 mt-1">tier unlocked</p>
            </div>
            <div className="bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-yellow-500/20 flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5 text-yellow-400" />
                </div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">V-Bucks</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.vBucks.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500 mt-1">balance</p>
            </div>
          </div>

          <div className="bg-[#080a0f]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                Top Players
              </h2>
              <div className="flex gap-1">
                {(["xp", "wins", "kills"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      activeTab === tab
                        ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="flex items-center justify-center h-24 rounded-lg bg-white/5 border border-white/5">
                <p className="text-xs text-gray-500">No leaderboard data available</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.accountId}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      entry.username === user?.username
                        ? "bg-cyan-500/10 border-cyan-500/20"
                        : "bg-white/[0.03] border-white/5"
                    }`}
                  >
                    <div className="w-6 flex items-center justify-center shrink-0">
                      {rankIcon(entry.rank)}
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-cyan-400/30 to-emerald-400/30 flex items-center justify-center shrink-0">
                      {(entry as any).avatar ? (
                        <img src={(entry as any).avatar} alt={entry.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-cyan-300">
                          {entry.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{entry.username}</p>
                      <p className="text-[10px] text-gray-500">Level {entry.level}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-white">
                        {activeTab === "xp"
                          ? entry.xp.toLocaleString()
                          : activeTab === "wins"
                          ? entry.wins
                          : entry.kills}
                      </p>
                      <p className="text-[10px] text-gray-500">{activeTab}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}
