// services/labStaffService.js
import api from "./baseAPI";

const labStaffService = {
  // Minimal lab list for the picker — served by labStaffRoutes.js, not labRoutes.js
  getLabsForPicker: (q = "") => api.get("/labs/staff/labs", { params: q ? { q } : {} }),

  // Read-only
  getAllStaff: (labId) => api.get(`/labs/${labId}/staff`),
  getStaffById: (labId, id) => api.get(`/labs/${labId}/staff/${id}`),

  // Admin (role: "admin") creation — sends a password-set link via SMS,
  // backend stores only the token hash.
  createAdmin: (labId, data) => api.post(`/labs/${labId}/admins`, data),

  // Staff (role: "staff") CRUD
  createStaff: (labId, data) => api.post(`/labs/${labId}/staff`, data),
  updatePermissions: (labId, id, permissions) => api.put(`/labs/${labId}/staff/${id}/permissions`, { permissions }),
  updateAdjustment: (labId, id, maxLabAdjustment) =>
    api.put(`/labs/${labId}/staff/${id}/adjustment`, { maxLabAdjustment }),
  deactivateStaff: (labId, id) => api.patch(`/labs/${labId}/staff/${id}/deactivate`),
  activateStaff: (labId, id) => api.patch(`/labs/${labId}/staff/${id}/activate`),
  deleteStaff: (labId, id) => api.delete(`/labs/${labId}/staff/${id}`),
  resendPasswordSetup: (labId, id) => api.post(`/labs/${labId}/staff/${id}/resend-password-setup`),

  // Permission catalog — served by THIS backend (proxies the internal call),
  // not the tenant backend's /staff-permissions (unreachable from this app).
  getPermissions: () => api.get("/labs/staff/permissions"),
};

export default labStaffService;