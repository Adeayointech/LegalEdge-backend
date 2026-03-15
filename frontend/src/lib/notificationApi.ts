import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const notificationAPI = {
  getNotifications: (limit?: number) => 
    axios.get(`${API_URL}/notifications`, {
      headers: getAuthHeader(),
      params: { limit },
    }),

  getUnreadCount: () =>
    axios.get(`${API_URL}/notifications/unread-count`, {
      headers: getAuthHeader(),
    }),

  markAsRead: (id: string) =>
    axios.put(`${API_URL}/notifications/${id}/read`, {}, {
      headers: getAuthHeader(),
    }),

  markAllAsRead: () =>
    axios.put(`${API_URL}/notifications/mark-all-read`, {}, {
      headers: getAuthHeader(),
    }),

  deleteNotification: (id: string) =>
    axios.delete(`${API_URL}/notifications/${id}`, {
      headers: getAuthHeader(),
    }),
};
