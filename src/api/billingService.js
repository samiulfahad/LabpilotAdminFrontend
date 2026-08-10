import api from "./baseAPI";

const billingService = {
  // GET labs with unpaid bills (grouped, with month tags)
  getUnpaidLabs: (params = {}) => api.get("/billing/unpaid-labs", { params }),

  // GET full billing history for a lab by labKey
  getLabHistoryByKey: (labKey, params = {}) =>
    api.get(`/billing/lab/${encodeURIComponent(labKey)}/history`, { params }),

  // GET quick summary (unpaid bill + totals) for a lab by labKey
  getLabSummaryByKey: (labKey) => api.get(`/billing/lab/${encodeURIComponent(labKey)}/summary`),

  // GET billing run history
  getRuns: (params = {}) => api.get("/billing/runs", { params }),

  // GET month-wise overview — all periods grouped with paid/unpaid/free stats
  getMonthOverview: () => api.get("/billing/month-overview"),

  // GET all labs' bills for a specific billing period (by periodStart timestamp)
  // Used by Month Overview drill-down tab
  getBillsByPeriod: (params = {}) => api.get("/billing/period-bills", { params }),

  // POST mark a bill as paid
  markPaid: (billingId, labId) => api.post(`/billing/pay/${billingId}`, { labId }),

  // POST manually trigger bill generation
  generate: (data = {}) => api.post("/billing/generate", data),

  // PATCH update due date of an unpaid bill
  updateDueDate: (billingId, dueDate) => api.patch(`/billing/${billingId}/due-date`, { dueDate }),

  // POST retry failed labs from a billing run
  retryFailed: (runId) => api.post(`/billing/runs/${runId}/retry-failed`),

  // DELETE all bills for a specific billing period
  deletePeriodBills: (periodStart) => api.delete(`/billing/period/${periodStart}`),
};

export default billingService;
