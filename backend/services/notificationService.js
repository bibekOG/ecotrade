const Notification = require('../models/Notification');
const { buildNotification } = require('../utils/notificationTypes');

/**
 * Notification Service
 * Centralized service for creating and managing notifications
 */

class NotificationService {
  /**
   * Create and save a notification
   */
  static async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();
      
      // Populate sender details for real-time emission
      await notification.populate('senderId', 'username fullName profilePicture');
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Create notification for new message
   */
  static async notifyNewMessage(senderId, recipientId, conversationId, messagePreview, senderName) {
    const notificationData = buildNotification('message', senderId, recipientId, {
      senderName,
      descriptionArgs: [messagePreview],
      redirectArgs: [conversationId],
      conversationId,
      message: messagePreview
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for post like
   */
  static async notifyPostLike(senderId, recipientId, postId, postPreview, senderName) {
    // Don't notify if user likes their own post
    if (senderId.toString() === recipientId.toString()) return null;

    const notificationData = buildNotification('like', senderId, recipientId, {
      senderName,
      descriptionArgs: [postPreview],
      redirectArgs: [postId],
      postId,
      message: `${senderName} liked your post`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for post comment
   */
  static async notifyPostComment(senderId, recipientId, postId, commentId, commentText, senderName) {
    // Don't notify if user comments on their own post
    if (senderId.toString() === recipientId.toString()) return null;

    const notificationData = buildNotification('comment', senderId, recipientId, {
      senderName,
      descriptionArgs: [commentText],
      redirectArgs: [postId],
      postId,
      commentId,
      message: `${senderName} commented on your post: ${commentText}`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for friend request
   */
  static async notifyFriendRequest(senderId, recipientId, senderName) {
    const notificationData = buildNotification('friend_request', senderId, recipientId, {
      senderName,
      descriptionArgs: [],
      redirectArgs: [],
      message: `${senderName} sent you a friend request`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for friend request accepted
   */
  static async notifyFriendAccepted(senderId, recipientId, senderName) {
    const notificationData = buildNotification('friend_accepted', senderId, recipientId, {
      senderName,
      descriptionArgs: [],
      redirectArgs: [senderId],
      message: `${senderName} accepted your friend request`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for new offer on product
   */
  static async notifyNewOffer(senderId, recipientId, productId, offerAmount, productName, senderName) {
    const notificationData = buildNotification('offer', senderId, recipientId, {
      senderName,
      descriptionArgs: [offerAmount, productName],
      redirectArgs: [productId],
      productId,
      message: `${senderName} offered $${offerAmount} for ${productName}`,
      metadata: { offerAmount }
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for offer accepted
   */
  static async notifyOfferAccepted(senderId, recipientId, productId, productName) {
    const notificationData = buildNotification('offer_accepted', senderId, recipientId, {
      descriptionArgs: [productName],
      redirectArgs: [productId],
      productId,
      message: `Your offer for ${productName} was accepted`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for offer rejected
   */
  static async notifyOfferRejected(senderId, recipientId, productId, productName) {
    const notificationData = buildNotification('offer_rejected', senderId, recipientId, {
      descriptionArgs: [productName],
      redirectArgs: [productId],
      productId,
      message: `Your offer for ${productName} was declined`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for product message
   */
  static async notifyProductMessage(senderId, recipientId, conversationId, productId, productName, senderName) {
    const notificationData = buildNotification('product_message', senderId, recipientId, {
      senderName,
      descriptionArgs: [productName],
      redirectArgs: [conversationId],
      conversationId,
      productId,
      message: `${senderName} sent you a message about ${productName}`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for product liked
   */
  static async notifyProductLike(senderId, recipientId, productId, productName, senderName) {
    // Don't notify if user likes their own product
    if (senderId.toString() === recipientId.toString()) return null;

    const notificationData = buildNotification('product_liked', senderId, recipientId, {
      senderName,
      descriptionArgs: [productName],
      redirectArgs: [productId],
      productId,
      message: `${senderName} liked your item: ${productName}`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for product approved
   */
  static async notifyProductApproved(adminId, sellerId, productId, productName) {
    const notificationData = buildNotification('product_approved', adminId, sellerId, {
      descriptionArgs: [productName],
      redirectArgs: [productId],
      productId,
      message: `Your item "${productName}" has been approved`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for product rejected
   */
  static async notifyProductRejected(adminId, sellerId, productId, productName, reason) {
    const notificationData = buildNotification('product_rejected', adminId, sellerId, {
      descriptionArgs: [productName, reason],
      redirectArgs: [productId],
      productId,
      message: `Your item "${productName}" was not approved`,
      metadata: { reason }
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Create notification for user mention
   */
  static async notifyMention(senderId, recipientId, postId, content, senderName) {
    // Don't notify if user mentions themselves
    if (senderId.toString() === recipientId.toString()) return null;

    const notificationData = buildNotification('mention', senderId, recipientId, {
      senderName,
      descriptionArgs: [content],
      redirectArgs: [postId],
      postId,
      message: `${senderName} mentioned you in a post`
    });

    return await this.createNotification(notificationData);
  }

  /**
   * Batch create notifications (e.g., for multiple mentions)
   */
  static async createBatchNotifications(notificationsArray) {
    try {
      const notifications = await Notification.insertMany(notificationsArray);
      
      // Populate sender details
      await Notification.populate(notifications, {
        path: 'senderId',
        select: 'username fullName profilePicture'
      });
      
      return notifications;
    } catch (error) {
      console.error('Error creating batch notifications:', error);
      throw error;
    }
  }

  /**
   * Delete old read notifications (cleanup job)
   */
  static async cleanupOldNotifications(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const result = await Notification.deleteMany({
        read: true,
        readAt: { $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} old notifications`);
      return result;
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      throw error;
    }
  }
}

module.exports = NotificationService;
