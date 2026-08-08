import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import baseAPI from "../api/baseAPI";
import { getDeviceInfo } from "../utils/deviceInfo";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      admin: null,
      token: null, // in-memory only — NOT persisted, see partialize below
      isAuthenticated: false,
      isInitializing: true, // true until the initial /admin/refresh check resolves

      setToken: (newToken) => set({ token: newToken }),

      // ── Called once on app mount (see App.jsx) ─────────────────────────────
      // The access token lives only in memory, so a hard refresh/new tab
      // always starts with token: null. This re-derives a fresh access token
      // from the httpOnly refresh cookie — same mechanism as the 444 retry
      // flow in baseAPI.js — so the session survives a reload without ever
      // putting the token in localStorage.
      //
      // `admin` is NOT guaranteed to survive a reload (persisted state can be
      // cleared, or this can be a fresh browser/tab that never had it), so we
      // rebuild it every time from the refresh response the same way login()
      // does: decoded JWT claims + server admin object. If the backend's
      // /admin/refresh response doesn't include `admin`, we fall back to
      // whatever's already in the store (persisted or from a prior call)
      // instead of wiping it out.
      initialize: async () => {
        try {
          const { data } = await baseAPI.post("/admin/refresh");
          const decodedAdmin = jwtDecode(data.accessToken);
          set((state) => ({
            admin: data.admin
              ? { ...decodedAdmin, ...data.admin }
              : state.admin
                ? { ...decodedAdmin, ...state.admin }
                : decodedAdmin,
            token: data.accessToken,
            isAuthenticated: true,
            isInitializing: false,
          }));
        } catch {
          set({ admin: null, token: null, isAuthenticated: false, isInitializing: false });
        }
      },

      // Three factors, in the same order the backend schema requires them:
      // favoriteWord (env allowlist), identifier (username OR phone), password.
      login: async (favoriteWord, identifier, password) => {
        try {
          const response = await baseAPI.post("/admin/login", {
            favoriteWord,
            identifier,
            password,
            device: getDeviceInfo(),
          });
          const { accessToken, admin } = response.data;
          const decodedAdmin = jwtDecode(accessToken);

          set({
            // Server's `admin` object is the source of truth for display
            // fields; decoded claims (role, id) come along for anything
            // that reads off the token shape elsewhere.
            admin: { ...decodedAdmin, ...admin },
            token: accessToken,
            isAuthenticated: true,
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || "Login failed. Please check your credentials.";
          return { success: false, message };
        }
      },

      // ── Logout current device only ─────────────────────────────────────────
      logout: async () => {
        try {
          await baseAPI.post("/admin/logout");
        } catch (error) {
          console.error("Logout API failed, but clearing local state anyway", error);
        } finally {
          set({ admin: null, token: null, isAuthenticated: false });
        }
      },

      // ── Logout all devices (requires auth, clears all tokens in DB) ────────
      logoutAll: async () => {
        try {
          await baseAPI.post("/admin/logout-all");
        } catch (error) {
          console.error("Logout-all API failed, but clearing local state anyway", error);
        } finally {
          set({ admin: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: "admin-auth",
      // Only non-sensitive display info survives a reload. `token` is
      // deliberately excluded — an access token in localStorage is
      // readable by any injected script (XSS, malicious extension, a
      // compromised dependency). `isAuthenticated` is excluded too, so a
      // stale "true" can't flash protected UI before initialize() confirms
      // the session is actually still valid.
      partialize: (state) => ({
        admin: state.admin,
      }),
    },
  ),
);
