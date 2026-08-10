import api from "./baseAPI";

const supportAdminService = {
  // Returns all active temporary support-admin accounts
  getAll: () => api.get("/support-admin"),

  // Search labs by labKey — powers the lab picker in the create-support-admin flow
  // Returns a bare array (unwraps { labs: [...] }) so callers can use it directly
  searchLabs: async (labKey) => {
    const { data } = await api.get("/support-admin/search-labs", {
      params: labKey?.trim() ? { labKey: labKey.trim() } : {},
    });
    return data.labs;
  },

  // Create a temporary support-admin account
  // data shape: { labKey, phone?, password, validityMinutes? } — validityMinutes
  // omitted means the backend defaults to 1hr
  create: (data) => api.post("/support-admin", data),

  // Delete a specific support-admin account by id
  deleteOne: (id) => api.delete(`/support-admin/${id}`),

  // Delete every support-admin account
  deleteAll: () => api.delete("/support-admin"),
};

export default supportAdminService;
