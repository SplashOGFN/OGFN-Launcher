import axios, { AxiosInstance, AxiosError } from "axios";
import { API_URL } from "@/lib/config";

const BASE_URL = API_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("splash.auth.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-Launcher-Version"] = "22.30.0";
  return config;
});
