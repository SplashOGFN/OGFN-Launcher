"use client";

import { create } from "zustand";
import { API_URL } from "@/lib/config";

function getDefaultSrc(): string {
  // No audio until user logs in — MusicProvider sets lobby music after auth
  return "";
}

interface MusicState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  src: string;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  setSrc: (src: string) => void;
}

const useMusicStore = create<MusicState>((set) => ({
  isPlaying: false,
  isMuted: false,
  volume: 0.3,
  src: getDefaultSrc(),

  setPlaying: (playing) => set({ isPlaying: playing }),
  setMuted: (muted) => {
    if (typeof window !== "undefined") localStorage.setItem("music_muted", String(muted));
    set({ isMuted: muted });
  },
  toggleMute: () => set((state) => {
    const muted = !state.isMuted;
    if (typeof window !== "undefined") localStorage.setItem("music_muted", String(muted));
    return { isMuted: muted };
  }),
  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    if (typeof window !== "undefined") localStorage.setItem("music_volume", String(clamped));
    set({ volume: clamped });
  },
  setSrc: (src) => {
    if (typeof window !== "undefined") localStorage.setItem("music_src", src);
    set({ src });
  },
}));

export default useMusicStore;
