"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import useMusicStore from "@/lib/stores/music";
import { API_URL } from "@/lib/config";

const AUTH_PATHS = ["/", "/register", "/splash/oauth/discord/callback"];

function isAuthPage(path: string): boolean {
  return AUTH_PATHS.includes(path) || path.startsWith("/splash/oauth");
}

export default function MusicProvider() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pathname = usePathname();
  const { isPlaying, isMuted, volume, src, setPlaying } = useMusicStore();

  // Manage audio element lifecycle
  useEffect(() => {
    if (!src) {
      audioRef.current = null;
      return;
    }

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = volume;
    audio.muted = isMuted;
    audioRef.current = audio;

    const handleCanPlay = () => {
      audio.play().catch(() => {});
      setPlaying(true);
    };

    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("error", () => {});

    return () => {
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.pause();
      audio.src = "";
    };
  }, [src, setPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Start/stop music based on current route + auth state
  useEffect(() => {
    const { setSrc } = useMusicStore.getState();
    const token = localStorage.getItem("classified.auth.token");
    const onAuthPage = isAuthPage(pathname);

    if (token && !onAuthPage) {
      const currentSrc = useMusicStore.getState().src;
      if (currentSrc !== `${API_URL}/api/music/lobby.mp3`) {
        setSrc(`${API_URL}/api/music/lobby.mp3`);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlaying(false);
      }
      const currentSrc = useMusicStore.getState().src;
      if (currentSrc !== "") {
        setSrc("");
      }
    }
  }, [pathname, setPlaying]);

  // Cross-tab logout via storage events
  useEffect(() => {
    const handleStorage = () => {
      const token = localStorage.getItem("classified.auth.token");
      const onAuthPage = isAuthPage(window.location.pathname);
      if (!token || onAuthPage) {
        useMusicStore.getState().setSrc("");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}
