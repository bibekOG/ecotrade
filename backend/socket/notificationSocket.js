/**
 * Notification Socket Handler
 * Manages real-time notification delivery via Socket.io
 */

let io = null;

/**
 * Initialize socket.io instance
 */
const initializeSocket = (socketInstance) => {
  io = socketInstance;
  console.log('Notification socket handler initialized');
};

/**
 * Emit notification to a specific user
 */
const emitToUser = (userId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return false;
  }

  try {
    io.to(`user_${userId}`).emit(event, data);
    return true;
  } catch (error) {
    console.error('Error emitting to user:', error);
    return false;
  }
};

/**
 * Emit new notification to user
 */
const emitNewNotification = (userId, notification) => {
  return emitToUser(userId, 'newNotification', notification);
};

/**
 * Emit notification read status update
 */
const emitNotificationRead = (userId, notificationId) => {
  return emitToUser(userId, 'notificationRead', { notificationId });
};

/**
 * Emit all notifications marked as read
 */
const emitAllNotificationsRead = (userId) => {
  return emitToUser(userId, 'allNotificationsRead', {});
};

/**
 * Emit notification deleted
 */
const emitNotificationDeleted = (userId, notificationId) => {
  return emitToUser(userId, 'notificationDeleted', { notificationId });
};

/**
 * Emit unread count update
 */
const emitUnreadCountUpdate = (userId, unreadCount) => {
  return emitToUser(userId, 'unreadCountUpdate', { unreadCount });
};

/**
 * Broadcast notification to multiple users
 */
const broadcastToUsers = (userIds, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return false;
  }

  try {
    userIds.forEach(userId => {
      io.to(`user_${userId}`).emit(event, data);
    });
    return true;
  } catch (error) {
    console.error('Error broadcasting to users:', error);
    return false;
  }
};

/**
 * Handle notification socket events
 */
const setupNotificationHandlers = (socket) => {
  // User joins their notification room
  socket.on('joinNotificationRoom', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined notification room`);
  });

  // User leaves their notification room
  socket.on('leaveNotificationRoom', (userId) => {
    socket.leave(`user_${userId}`);
    console.log(`User ${userId} left notification room`);
  });

  // Request unread count
  socket.on('requestUnreadCount', async (userId) => {
    try {
      const Notification = require('../models/Notification');
      const count = await Notification.countDocuments({
        recipientId: userId,
        read: false
      });
      emitUnreadCountUpdate(userId, count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  });
};

module.exports = {
  initializeSocket,
  setupNotificationHandlers,
  emitNewNotification,
  emitNotificationRead,
  emitAllNotificationsRead,
  emitNotificationDeleted,
  emitUnreadCountUpdate,
  broadcastToUsers
};
