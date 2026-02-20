import api from "./axios";

// Backend controller: /api/user
export const getAllUsers = () => api.get("/user");

export const getUserById = (id) => api.get(`/user/${id}`);

export const createUser = (payload) => api.post("/user", payload);

export const updateUser = (id, payload) => api.put(`/user/${id}`, payload);

export const deleteUser = (id) => api.delete(`/user/${id}`);

export const updateUserStatus = (id, enabled) =>
  api.put(`/user/${id}/status`, { enabled });

export const updateUserLockStatus = (id, locked) =>
  api.put(`/user/${id}/lock`, { locked });

export const changePassword = (currentPassword, newPassword) =>
  api.put("/user/change-password", { currentPassword, newPassword });

export const getProfile = () =>
  api.get("/user/profile");

export const updateProfile = (payload) =>
  api.put("/user/profile", payload);

