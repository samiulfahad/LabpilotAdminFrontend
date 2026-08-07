// services/labService.js
import api from "./baseAPI";

const labService = {
  // ─── LAB METHODS ────────────────────────────────────────────
  getStats: () => api.get("/labs/stats"),
  getLabs: ({ page = 1, limit = 10, labKey = "" } = {}) => {
    const params = { page, limit };
    if (labKey) params.labKey = labKey;
    return api.get("/labs/all", { params });
  },
  getLabById: (id) => api.get(`/labs/${id}`),
  createLab: (data) => api.post("/labs", data),

  updateLabDetails: (id, details) => api.patch(`/labs/${id}/details`, details),
  updateLabContact: (id, contact) => api.patch(`/labs/${id}/contact`, { contact }),
  updateLabBilling: (id, billing) => api.patch(`/labs/${id}/billing`, { billing }),

  activateLab: (id) => api.patch(`/labs/${id}/activate`),
  deactivateLab: (id) => api.patch(`/labs/${id}/deactivate`),
  deleteLab: (id) => api.delete(`/labs/${id}`),

  // ─── STAFF METHODS ──────────────────────────────────────────
  getAllStaff: (labId) => api.get(`/labs/${labId}/staff`),
  getStaffById: (labId, id) => api.get(`/labs/${labId}/staff/${id}`),

  createAdmin: (labId, data) => api.post(`/labs/${labId}/staff/admin`, data),
  createMember: (labId, data) => api.post(`/labs/${labId}/staff/member`, data),
  createSupport: (labId, data) => api.post(`/labs/${labId}/staff/support`, data),

  updateStaff: (labId, id, data) => api.patch(`/labs/${labId}/staff/${id}`, data),
  // ✅ Fixed: correct endpoint for support password
  updateSupportPassword: (labId, data) => api.patch(`/labs/${labId}/staff/support/password`, data),

  activateStaff: (labId, id) => api.patch(`/labs/${labId}/staff/${id}/activate`),
  deactivateStaff: (labId, id) => api.patch(`/labs/${labId}/staff/${id}/deactivate`),

  deleteStaff: (labId, id) => api.delete(`/labs/${labId}/staff/${id}`),
  deleteSupport: (labId) => api.delete(`/labs/${labId}/staff/support`),
};

export default labService;
