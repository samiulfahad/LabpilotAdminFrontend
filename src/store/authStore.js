import { create } from "zustand";
import { persist } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import baseAPI from "../api/baseAPI";
import { getDeviceInfo } from "../utils/deviceInfo";

export const useAuthStore = create(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      setToken: (newToken) => set({ token: newToken }),

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
          console.log(response);
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
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
