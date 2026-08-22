import api from "./baseAPI";

const supportInboxService = {
  getMessages: (status) => api.get("/support/messages", { params: status ? { status } : {} }),
  updateStatus: (_id, status) => api.patch(`/support/messages/${_id}/status`, { status }),
  deleteMessage: (_id) => api.delete(`/support/messages/${_id}`),
};

export default supportInboxService;
