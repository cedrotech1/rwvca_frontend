import apiClient from './config';

export const notificationsService = {
  // Get all notifications for current user
  async getNotifications() {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  // Mark a notification as read
  async markAsRead(notificationId) {
    const response = await apiClient.put(`/notifications/read/${notificationId}`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead() {
    const response = await apiClient.put('/notifications/read-all');
    return response.data;
  },

  // Delete a notification
  async deleteNotification(notificationId) {
    const response = await apiClient.delete(`/notifications/delete/${notificationId}`);
    return response.data;
  },

  // Delete all notifications
  async deleteAllNotifications() {
    const response = await apiClient.delete('/notifications/delete-all');
    return response.data;
  },

  // Create a new notification
  async createNotification(notificationData) {
    const response = await apiClient.post('/notifications/create', notificationData);
    return response.data;
  }
};
