"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Info, LogOut, Pencil, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth";
import { useSessionStore } from "@/lib/stores/session";
import { apiClient } from "@/lib/api/client";
import { endpoints } from "@/lib/api/splash-endpoints";
import Sidebar from "@/components/layout/Sidebar";

export default function SettingsPage() {
  const router = useRouter();
  const auth = useAuthStore();
  const session = useSessionStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarInput, setAvatarInput] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [eor, setEor] = useState(false);
  const [ror, setRor] = useState(false);
  const [bubbleBuilds, setBubbleBuilds] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const user = mounted ? (session.user || auth.user) : null;
  const currentAvatar = mounted ? ((user as any)?.avatar || null) : null;

  const handleLogout = () => {
    auth.logout();
    router.push("/");
  };

  const handleAvatarSave = async () => {
    if (!avatarInput.trim()) return;
    setAvatarError("");
    setAvatarSaving(true);
    try {
      const res = await apiClient.post(endpoints.POST_AVATAR, {
        accountId: user?.accountId,
        avatarUrl: avatarInput.trim(),
      });
      session.setAvatar(res.data.avatar);
      setShowAvatarModal(false);
      setAvatarInput("");
      setAvatarPreview("");
    } catch (e: any) {
      setAvatarError(e?.response?.data?.error || "Failed to save avatar.");
    } finally {
      setAvatarSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#05070a] text-white overflow-hidden">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="max-w-2xl space-y-6">
          <section className="bg-[#080a0f] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">Account</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center ring-2 ring-white/10">
                    {currentAvatar ? (
                      <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-black">
                        {(user?.displayName || user?.username || "P").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-medium">{user?.displayName || user?.username || "Unknown"}</p>
                  <p className="text-sm text-gray-400">{user?.accountId}</p>
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-0.5"
                  >
                    Change avatar
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </section>

          <section className="bg-[#080a0f] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold">About</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Launcher Version</span>
                <span className="bg-white/5 px-3 py-1 rounded-md">1.0.0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Credits</span>
                <span className="text-gray-300">s3cw</span>
              </div>
            </div>
          </section>

          <section className="bg-[#080a0f] border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-semibold">Build Settings</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "Enable EOR", state: eor, set: setEor },
                { label: "Enable ROR", state: ror, set: setRor },
                { label: "Enable Bubble Builds", state: bubbleBuilds, set: setBubbleBuilds },
              ].map(({ label, state, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{label}</span>
                  <button
                    type="button"
                    onClick={() => set(!state)}
                    className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                      state ? "bg-cyan-500" : "bg-gray-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        state ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {showAvatarModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#080a0f] border border-white/10 rounded-xl p-6 w-full max-w-sm mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Change Avatar</h3>
                <button onClick={() => { setShowAvatarModal(false); setAvatarError(""); setAvatarInput(""); setAvatarPreview(""); }} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {avatarPreview && (
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-cyan-500/40">
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" onError={() => setAvatarPreview("")} />
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 mb-2">Paste any direct image URL (GitHub, Imgur, Discord CDN, etc.).</p>
              <p className="text-xs text-gray-500 mb-3">NSFW images are not allowed and will be rejected.</p>

              <input
                type="url"
                value={avatarInput}
                onChange={(e) => { setAvatarInput(e.target.value); setAvatarPreview(e.target.value); setAvatarError(""); }}
                placeholder="https://example.com/avatar.png"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-500/50 mb-1"
              />

              {avatarError && <p className="text-xs text-red-400 mb-3">{avatarError}</p>}

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => { setShowAvatarModal(false); setAvatarError(""); setAvatarInput(""); setAvatarPreview(""); }} className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleAvatarSave}
                  disabled={avatarSaving || !avatarInput.trim()}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  {avatarSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#080a0f] border border-white/10 rounded-xl p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Logout?</h3>
              <p className="text-gray-400 text-sm mb-4">
                You will be returned to the login screen.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

