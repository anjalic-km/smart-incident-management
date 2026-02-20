import api from "./axios";

// Backend controller: /api/admin/sla
export const getAllSlaPolicies = () => api.get("/admin/sla");

export const createSlaPolicy = (payload) => api.post("/admin/sla", payload);

export const updateSlaPolicy = (projectId, priorityLevel, payload) =>
  api.put(`/admin/sla/${projectId}/${encodeURIComponent(priorityLevel)}`, payload);

export const deleteSlaPolicy = (projectId, priorityLevel) =>
  api.delete(`/admin/sla/${projectId}/${encodeURIComponent(priorityLevel)}`);
