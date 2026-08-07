import baseAPI from "./baseAPI";

const accountService = {
  getMe: () => baseAPI.get("/admin/me"),
  getSessions: () => baseAPI.get("/admin/sessions"),
  revokeSession: (deviceId) => baseAPI.delete(`/admin/sessions/${deviceId}`),
  changePassword: (payload) => baseAPI.post("/admin/change-password", payload),
};

export default accountService;
