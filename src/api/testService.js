import api from "./baseAPI";

const testService = {
  getAll:   (params)    => api.get("/test/all", { params }),
  getById:  (id)        => api.get(`/test/${id}`),
  create:   (data)      => api.post("/test", data),
  update:   (id, data)  => api.patch(`/test/${id}`, data),
  updateSchema: (id, schemaId) => api.patch(`/test/${id}/schema`, { schemaId }),
  delete:   (id)        => api.delete(`/test/${id}`),
  checkDuplicate: (name) => api.get("/test/check-duplicate", { params: { name } }),
};

export default testService;