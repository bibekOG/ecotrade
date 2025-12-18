const Notification = require("../models/Notification");
const User = require("../models/User");
const { emitUnreadCountUpdate } = require("../socket/notificationSocket");

/**
 * Get all notifications for a user with pagination
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userId })
        .populate("senderId", "username fullName profilePicture")
        .populate("postId", "desc title img")
        .populate("productId", "productName productDescription productImages")
        .populate("commentId", "text")
        .populate("conversationId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipientId: userId }),
      Notification.countDocuments({ recipientId: userId, read: false })
    ]);

    res.status(200).json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalNotifications: totalCount,
        hasMore: skip + notifications.length < totalCount
      },
      unreadCount
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

/**
 * Get unread notifications count
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const count = await Notification.countDocuments({ 
      recipientId: userId, 
      read: false 
    });

    res.status(200).json({ unreadCount: count });
  } catch (err) {
    console.error("Error fetching unread count:", err);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

/**
 * Get latest unread notifications (for dropdown)
 */
const getLatestNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 5;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const notifications = await Notification.find({ 
      recipientId: userId 
    })
      .populate("senderId", "username fullName profilePicture")
      .populate("postId", "desc img")
      .populate("productId", "productName productImages")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({ 
      recipientId: userId, 
      read: false 
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    console.error("Error fetching latest notifications:", err);
    res.status(500).json({ error: "Failed to fetch latest notifications" });
  }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { 
        read: true,
        readAt: new Date()
      },
      { new: true }
    ).populate("senderId", "username fullName profilePicture");

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({ 
      recipientId: userId, 
      read: false 
    });

    // Emit real-time unread count update
    emitUnreadCountUpdate(userId, unreadCount);

    res.status(200).json({ notification, unreadCount });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const result = await Notification.updateMany(
      { recipientId: userId, read: false },
      { 
        read: true,
        readAt: new Date()
      }
    );

    // Get updated unread count and emit update
    const unreadCount = await Notification.countDocuments({ 
      recipientId: userId, 
      read: false 
    });
    emitUnreadCountUpdate(userId, unreadCount);

    res.status(200).json({ 
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
      unreadCount
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};

/**
 * Delete a single notification
 */
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({ 
      recipientId: userId, 
      read: false 
    });

    // Emit real-time unread count update
    emitUnreadCountUpdate(userId, unreadCount);

    res.status(200).json({ 
      message: "Notification deleted successfully",
      unreadCount
    });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ error: "Failed to delete notification" });
  }
};

/**
 * Delete all read notifications for a user
 */
const deleteAllRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const result = await Notification.deleteMany({
      recipientId: userId,
      read: true
    });

    res.status(200).json({ 
      message: "All read notifications deleted",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting read notifications:", err);
    res.status(500).json({ error: "Failed to delete read notifications" });
  }
};

/**
 * Delete all notifications for a user
 */
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const result = await Notification.deleteMany({
      recipientId: userId
    });

    res.status(200).json({ 
      message: "All notifications deleted",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    console.error("Error deleting all notifications:", err);
    res.status(500).json({ error: "Failed to delete all notifications" });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  getLatestNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  deleteAllNotifications
};
