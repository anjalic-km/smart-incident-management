import api from "./axios";

// Backend controller: /api/notification
export const getNotifications = (page = 0, size = 10) =>
  api.get("/notification", { params: { page, size } });

export const getUnreadNotificationsCount = () =>
  api.get("/notification/unread-count");

export const markNotificationAsRead = (id) =>
  api.put(`/notification/${id}/read`);

export const markAllNotificationsAsRead = () =>
  api.put("/notification/mark-all-read");

export const deleteNotification = (id) =>
  api.delete(`/notification/${id}`);
