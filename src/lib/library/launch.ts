"use client";

import { invoke } from "@tauri-apps/api/core";
import { sendNotification } from "@tauri-apps/plugin-notification";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { listen } from "@tauri-apps/api/event";
import { apiClient } from "@/lib/api/client";
import useBuildsStore from "@/lib/stores/builds";
import { API_URL } from "@/lib/config";

export const launchBuild = async (selectedPath: string, version: string) => {
  const appWindow = getCurrentWebviewWindow();
  const buildstate = useBuildsStore.getState();

  const token = localStorage.getItem("classified.auth.token");

  if (!token) {
    sendNotification({
      title: "Classified",
      body: "You are not authenticated!",
      sound: "ms-winsoundevent:Notification.Default",
    });
    return false;
  }

  const exists = (await invoke("check_game_exists", { path: selectedPath }).catch(() => false)) as boolean;
  if (!exists) {
    sendNotification({
      title: "Classified",
      body: "Game does not exist!",
      sound: "ms-winsoundevent:Notification.Default",
    });
    return false;
  }

  try {
    sendNotification({
      title: `Starting ${version}`,
      body: `This may take a while so please wait while the game loads!`,
      sound: "ms-winsoundevent:Notification.Default",
    });

    let exchangeCode: string | null = null;
    try {
      const exchangeRes = await apiClient.post("/launcher/api/auth/exchange", {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      exchangeCode = exchangeRes.data?.exchangeCode || null;
    } catch (apiErr: any) {
      console.error("Exchange code error:", apiErr);
      sendNotification({
        title: "Classified",
        body: `Exchange code failed: ${apiErr?.response?.data?.error || apiErr?.message || "Backend unreachable"}`,
        sound: "ms-winsoundevent:Notification.Default",
      });
      return false;
    }

    if (!exchangeCode) {
      sendNotification({
        title: "Classified",
        body: "Backend did not return an exchange code.",
        sound: "ms-winsoundevent:Notification.Default",
      });
      return false;
    }

    await invoke("experience", {
      folderPath: selectedPath.replace("/", "\\"),
      exchangeCode: exchangeCode,
      isDev: false,
      eor: buildstate.EorEnabled,
      version,
    });

    appWindow.minimize();

    return true;
  } catch (err: any) {
    console.error("Launch error:", err);
    sendNotification({
      title: "Classified",
      body: err?.toString?.() || "Failed to launch game.",
      sound: "ms-winsoundevent:Notification.Default",
    });
    return false;
  }
};

export async function getFilesToProcess(version: string) {
  try {
    const res = await apiClient.get(`/launcher/builds/${version}/files`);
    return res.data || [];
  } catch {
    return [];
  }
}

export async function processFilesWithProgress(
  path: string,
  version: string,
  files: { Name: string; Size: number; Url: string }[],
  setDownloadProgress: Function,
  setIsDownloadModalOpen: Function
) {
  const completedFiles: string[] = [];
  const fileNames = files.map((f) => f.Name);
  const downloadSpeeds: Record<string, number> = {};
  const statusMessages: Record<string, string> = {};
  const downloadProgress: Record<string, number> = {};

  setDownloadProgress({
    files: fileNames,
    completed: [],
    speeds: downloadSpeeds,
    progress: downloadProgress,
    messages: statusMessages,
  });

  setIsDownloadModalOpen(true);

  const unlistenProgress = await listen("download-progress", (event) => {
    const { filename, progress, speed, message } = event.payload as {
      filename: string;
      progress: number;
      speed: number;
      message?: string;
    };

    downloadSpeeds[filename] = speed;
    downloadProgress[filename] = progress;

    if (message) {
      statusMessages[filename] = message;
    }

    setDownloadProgress((prev: any) => ({
      ...prev,
      speeds: { ...downloadSpeeds },
      messages: { ...statusMessages },
      progress: { ...downloadProgress },
    }));
  });

  const unlistenCompleted = await listen("download-completed", (event) => {
    const { filename } = event.payload as { filename: string };

    if (!completedFiles.includes(filename)) {
      completedFiles.push(filename);
    }

    downloadSpeeds[filename] = 0;
    downloadProgress[filename] = 100;
    statusMessages[filename] = "Download complete";

    setDownloadProgress((prev: any) => ({
      ...prev,
      completed: [...completedFiles],
      speeds: { ...downloadSpeeds },
      messages: { ...statusMessages },
      progress: { ...downloadProgress },
    }));
  });

  const queue = [...files];
  const failed: Array<{ file: (typeof files)[0]; error: string }> = [];

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file) continue;

    const downloadPath = [".pak", ".sig", ".utoc", ".ucas"].some((ext) => file.Name.includes(ext))
      ? `${path}\\FortniteGame\\Content\\Paks\\`
      : `${path}\\`;

    try {
      const exists = await invoke("check_file_exists_and_size", {
        path: `${downloadPath}${file.Name}`,
        size: file.Size,
      });

      if (!exists || [".cer", ".bin"].some((ext) => file.Name.includes(ext))) {
        statusMessages[file.Name] = "Downloading...";
        setDownloadProgress((prev: any) => ({
          ...prev,
          messages: { ...statusMessages },
        }));

        await invoke("download_game_file", {
          url: file.Url,
          dest: `${downloadPath}${file.Name}`,
        });
      } else {
        if (!completedFiles.includes(file.Name)) {
          completedFiles.push(file.Name);
          statusMessages[file.Name] = "Already downloaded";
          setDownloadProgress((prev: any) => ({
            ...prev,
            completed: [...completedFiles],
            messages: { ...statusMessages },
          }));
        }
      }
    } catch (error) {
      statusMessages[file.Name] = `Error: ${error}`;

      failed.push({ file, error: String(error) });

      if (!completedFiles.includes(file.Name)) {
        completedFiles.push(file.Name);
        setDownloadProgress((prev: any) => ({
          ...prev,
          completed: [...completedFiles],
          messages: { ...statusMessages },
        }));
      }
    }
  }

  await unlistenProgress();
  await unlistenCompleted();

  return {
    completed: completedFiles,
    failed,
  };
}

export const processFiles = async (version: string) => {
  const files: { name: string; path: string; size: number; url: string }[] = [];

  if (Number(version) == 9.1) {
    const downloadTasks = files.map(async (file) => {
      const downloadPath = `${file.path}\\`;

      const exists = await invoke("check_file_exists", {
        path: `${downloadPath}${file.name}`,
        size: file.size,
      });
      if (!exists) {
        await invoke("download_game_file", {
          url: file.url,
          dest: `${downloadPath}${file.name}`,
        });
      }

      if (exists && [".cer", ".bin"].some((ext) => file.name.includes(ext))) {
        await invoke("download_game_file", {
          url: file.url,
          dest: `${downloadPath}${file.name}`,
        });
      }
    });

    await Promise.allSettled(downloadTasks);
  }
};
