import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { io } from 'socket.io-client';
import apiClient from '../utils/apiClient';
import { AuthContext } from './AuthContext';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);

  const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8900';

  // Initialize Socket.io connection
  useEffect(() => {
    if (user?._id) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        // Add user to socket
        newSocket.emit('addUser', user._id);
        // Join notification room for real-time notifications
        newSocket.emit('joinNotificationRoom', user._id);
        console.log('📢 Joined notification room for user:', user._id);
        
        // Request initial unread count
        fetchUnreadCount();
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.emit('leaveNotificationRoom', user._id);
          newSocket.disconnect();
        }
      };
    }
  }, [user?._id, SOCKET_URL]);

  // Listen for new notifications via Socket.io
  useEffect(() => {
    if (socket && user?._id) {
      const handleNewNotification = (notification) => {
        console.log('🔔 New notification received:', notification);
        
        // Add to notifications list (only if not already present)
        setNotifications(prev => {
          const exists = prev.find(n => n._id === notification._id);
          if (exists) return prev;
          return [notification, ...prev];
        });
        
        // Increment unread count if notification is unread
        if (!notification.read) {
          setUnreadCount(prev => prev + 1);
        }

        // Optional: Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(notification.title, {
              body: notification.message || notification.description,
              icon: '/assets/logo192.png',
              badge: '/assets/logo192.png'
            });
          } catch (err) {
            console.log('Browser notification error:', err);
          }
        }

        // Optional: Play notification sound
        playNotificationSound();
      };

      const handleUnreadCountUpdate = (data) => {
        console.log('📊 Unread count updated:', data.unreadCount);
        setUnreadCount(data.unreadCount || 0);
      };

      socket.on('newNotification', handleNewNotification);
      socket.on('unreadCountUpdate', handleUnreadCountUpdate);

      return () => {
        socket.off('newNotification', handleNewNotification);
        socket.off('unreadCountUpdate', handleUnreadCountUpdate);
      };
    }
  }, [socket, user?._id]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    if (!user?._id) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/notifications`, {
        params: { userId: user._id, page, limit }
      });

      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Fetch latest notifications (for dropdown)
  const fetchLatestNotifications = useCallback(async (limit = 5) => {
    if (!user?._id) return;

    try {
      const response = await apiClient.get(`/notifications/latest/${user._id}`, {
        params: { limit }
      });

      if (response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching latest notifications:', error);
    }
  }, [user?._id]);

  // Fetch unread count only
  const fetchUnreadCount = useCallback(async () => {
    if (!user?._id) return;

    try {
      const response = await apiClient.get(`/notifications/unread-count/${user._id}`);
      if (response.data) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user?._id]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user?._id) return;

    try {
      const response = await apiClient.put(
        `/notifications/${notificationId}/read`,
        { userId: user._id }
      );

      if (response.data) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId
              ? { ...notif, read: true, readAt: new Date() }
              : notif
          )
        );
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user?._id]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?._id) return;

    try {
      await apiClient.put(`/notifications/read-all`, {
        userId: user._id
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user?._id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user?._id) return;

    try {
      const response = await apiClient.delete(
        `/notifications/${notificationId}`,
        { data: { userId: user._id } }
      );

      if (response.data) {
        // Remove from local state
        setNotifications(prev =>
          prev.filter(notif => notif._id !== notificationId)
        );
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user?._id]);

  // Delete all read notifications
  const deleteAllRead = useCallback(async () => {
    if (!user?._id) return;

    try {
      await apiClient.delete(`/notifications/delete-read/${user._id}`);

      // Remove read notifications from local state
      setNotifications(prev => prev.filter(notif => !notif.read));
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  }, [user?._id]);

  // Request browser notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/assets/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (error) {
      console.log('Notification sound not available');
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (user?._id) {
      fetchLatestNotifications();
      fetchUnreadCount();
      requestNotificationPermission();
      
      // Refresh unread count every 30 seconds to stay in sync
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?._id, fetchLatestNotifications, fetchUnreadCount, requestNotificationPermission]);

  const value = {
    notifications,
    unreadCount,
    loading,
    socket,
    fetchNotifications,
    fetchLatestNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    requestNotificationPermission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for easy access
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
