"use client";

import { invoke } from "@tauri-apps/api/core";
import { handleAddBuild as addbuild } from "./addbuild";
import { getFilesToProcess, launchBuild, processFiles, processFilesWithProgress } from "./launch";
import useBuildsStore from "@/lib/stores/builds";
import { API_URL } from "@/lib/config";

export const handleLaunchBuild = async (
  path: string,
  version: string,
  activeBuild: string,
  setActiveBuild: Function,
  setIsDialogOpen: Function,
  setDownloadProgress: Function,
  setIsDownloadModalOpen: Function
) => {
  if (activeBuild === path) {
    setIsDialogOpen(true);
  } else {
    try {
      const buildState = useBuildsStore.getState();
      if (!buildState.FileCheck) {
        const filesToProcess = await getFilesToProcess(version);

        if (filesToProcess.length > 0) {
          if (buildState.BubbleBuilds) {
            filesToProcess.push({
              Name: "pakchunkSplashBubble-WindowsNoEditor_P.pak",
              Url: `${API_URL}/files/pakchunkSplashBubble-WindowsNoEditor_P.pak`,
              Size: 339,
            });
            filesToProcess.push({
              Name: "pakchunkSplashBubble-WindowsNoEditor_P.utoc",
              Url: `${API_URL}/files/pakchunkSplashBubble-WindowsNoEditor_P.utoc`,
              Size: 6203,
            });
            filesToProcess.push({
              Name: "pakchunkSplashBubble-WindowsNoEditor_P.ucas",
              Url: `${API_URL}/files/pakchunkSplashBubble-WindowsNoEditor_P.ucas`,
              Size: 5743840,
            });
            filesToProcess.push({
              Name: "pakchunkSplashBubble-WindowsNoEditor_P.sig",
              Url: `${API_URL}/files/pakchunkSplashBubble-WindowsNoEditor_P.sig`,
              Size: 4660,
            });
          } else {
            try {
              await invoke("delete_file", {
                filePath:
                  path + "\\FortniteGame\\Content\\Paks\\pakchunkSplashBubble-WindowsClient.pak",
              });
              await invoke("delete_file", {
                filePath:
                  path + "\\FortniteGame\\Content\\Paks\\pakchunkSplashBubble-WindowsClient.sig",
              });
            } catch {
            }
          }

          setDownloadProgress({
            files: filesToProcess.map((f: any) => f.Name),
            completed: [],
          });

          await processFilesWithProgress(
            path,
            version,
            filesToProcess,
            setDownloadProgress,
            setIsDownloadModalOpen
          );
        } else {
          await processFiles(version);
        }

        setIsDownloadModalOpen(false);
      }

      setActiveBuild(path);
      await launchBuild(path, version);
    } catch {
      setIsDownloadModalOpen(false);
    }
  }
};

export const handleAddBuild = async (setIsLoading: Function) => {
  setIsLoading(true);
  const newBuild = await addbuild();
  if (newBuild) {
    setIsLoading(false);
  }
};

export const handleCloseBuild = async (setActiveBuild: Function, setIsDialogOpen: Function) => {
  const exit = await invoke("exit_all");
  if (exit) {
    setActiveBuild(null);
    setIsDialogOpen(false);
  }
};

export const checkifopen = async (setActiveBuild: Function) => {
  try {
    const isOpen = await invoke("get_fortnite_processid");
    if (isOpen && typeof isOpen === "string") {
      setActiveBuild(
        isOpen.replace("\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe", "")
      );
    }
  } catch {
  }
};
