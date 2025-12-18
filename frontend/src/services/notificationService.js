/**
 * Notification API Service
 * Handles all HTTP requests related to notifications
 */

import axios from 'axios';

const API_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "/api";

class NotificationAPIService {
  /**
   * Get all notifications for a user with pagination
   */
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const response = await axios.get(`${API_URL}/notifications`, {
        params: { userId, page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Get latest notifications (for dropdown)
   */
  async getLatestNotifications(userId, limit = 5) {
    try {
      const response = await axios.get(`${API_URL}/notifications/latest/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching latest notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(userId) {
    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count/${userId}`);
      return response.data.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`, {
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId) {
    try {
      const response = await axios.put(`${API_URL}/notifications/read-all`, {
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const response = await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        data: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId) {
    try {
      const response = await axios.delete(`${API_URL}/notifications/delete-read/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(userId) {
    try {
      const response = await axios.delete(`${API_URL}/notifications/delete-all/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }
}

// Export singleton instance
const notificationAPIService = new NotificationAPIService();
export default notificationAPIService;
