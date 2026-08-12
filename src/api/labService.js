// services/labService.js
import api from "./baseAPI";

const labService = {
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
  updateLabLimit: (id, limit) => api.patch(`/labs/${id}/limit`, { limit }),
  updateLabMedicalReport: (id, medicalReport) => api.patch(`/labs/${id}/medical-report`, { medicalReport }),

  activateLab: (id) => api.patch(`/labs/${id}/activate`),
  deactivateLab: (id) => api.patch(`/labs/${id}/deactivate`),
};

export default labService;
