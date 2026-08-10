import axios from "axios";
import { useAuthStore } from "../store/authStore";

const ip = "http://10.39.87.187:5000/v1";
const local = "http://localhost:5000/v1";
const baseAPI = axios.create({
  baseURL: local,
  timeout: 15000,
  withCredentials: true, // ✅ sends cookies cross-origin (refreshToken, deviceId)
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const resetRefreshState = (error = null, token = null) => {
  processQueue(error, token);
  isRefreshing = false;
};

// ── Request interceptor: attach access token ──────────────────────────────
baseAPI.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────
baseAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ── No response = pure network error / timeout — DO NOT logout ─────────
    if (!error.response) {
      if (originalRequest?.url?.includes("/refresh")) {
        resetRefreshState(error);
      }
      return Promise.reject(error);
    }

    // ── 445: refresh token dead → hard logout, never retry ────────────────
    if (status === 445) {
      resetRefreshState(error);
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    // ── 444: access token expired → attempt silent refresh ────────────────
    if (status === 444 && !originalRequest._retry) {
      // /admin/refresh itself came back 444 — treat as fatal
      if (originalRequest.url.includes("/refresh")) {
        resetRefreshState(error);
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // Another request is already refreshing — queue and wait
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return baseAPI(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await baseAPI.post("/admin/refresh");
        const newAccessToken = data.accessToken;
        useAuthStore.getState().setToken(newAccessToken);
        resetRefreshState(null, newAccessToken);
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return baseAPI(originalRequest);
      } catch (refreshError) {
        // Only hard-logout if refresh explicitly failed with 445
        // Network errors during refresh should NOT logout the user
        if (refreshError.response?.status === 445) {
          useAuthStore.getState().logout();
        }
        resetRefreshState(refreshError);
        return Promise.reject(refreshError);
      }
    }

    // All other errors (400, 403, 500 …) pass through untouched
    return Promise.reject(error);
  },
);

export default baseAPI;
