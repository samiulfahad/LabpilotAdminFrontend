import api from "./baseAPI";

const schemaService = {
  getAll: () => api.get("/test-schema/all"),

  getByTestId: (testId) => api.get(`/test-schema/by-test/${testId}`),

  getById: (id) => api.get(`/test-schema/${id}`),

  create: (data) => api.post("/test-schema", data),

  update: (id, data) => api.patch(`/test-schema/${id}`, data),

  setDefault: (id) => api.patch(`/test-schema/${id}/set-default`),

  delete: (id) => api.delete(`/test-schema/${id}`),
};

export default schemaService;
