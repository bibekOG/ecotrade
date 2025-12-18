const router = require("express").Router();
const notificationController = require("../controllers/notificationController");

// Get all notifications for a user (with pagination)
router.get("/", notificationController.getUserNotifications);

// Get latest notifications (for dropdown)
router.get("/latest/:userId", notificationController.getLatestNotifications);

// Get unread notifications count
router.get("/unread-count/:userId", notificationController.getUnreadCount);

// Mark a single notification as read
router.put("/:id/read", notificationController.markAsRead);

// Mark all notifications as read
router.put("/read-all", notificationController.markAllAsRead);

// Delete a single notification
router.delete("/:id", notificationController.deleteNotification);

// Delete all read notifications
router.delete("/delete-read/:userId", notificationController.deleteAllRead);

// Delete all notifications
router.delete("/delete-all/:userId", notificationController.deleteAllNotifications);

module.exports = router;
