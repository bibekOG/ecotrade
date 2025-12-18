/**
 * Notification Types Configuration
 * Centralized configuration for all notification types
 */

const NOTIFICATION_TYPES = {
  // Message Notifications
  MESSAGE: {
    type: 'message',
    icon: '💬',
    getTitle: (sender) => `New message from ${sender}`,
    getDescription: (content) => content || 'You have a new message',
    getRedirectLink: (conversationId) => `/messages/${conversationId}`
  },

  // Post Notifications
  POST_LIKED: {
    type: 'like',
    icon: '❤️',
    getTitle: (sender) => `${sender} liked your post`,
    getDescription: (postContent) => postContent || 'Someone liked your post',
    getRedirectLink: (postId) => `/post/${postId}`
  },

  POST_COMMENTED: {
    type: 'comment',
    icon: '💭',
    getTitle: (sender) => `${sender} commented on your post`,
    getDescription: (comment) => comment || 'Someone commented on your post',
    getRedirectLink: (postId) => `/post/${postId}`
  },

  // Friend System Notifications
  FRIEND_REQUEST: {
    type: 'friend_request',
    icon: '👤',
    getTitle: (sender) => `Friend request from ${sender}`,
    getDescription: () => 'Wants to connect with you',
    getRedirectLink: () => '/friends/requests'
  },

  FRIEND_ACCEPTED: {
    type: 'friend_accepted',
    icon: '✅',
    getTitle: (sender) => `${sender} accepted your friend request`,
    getDescription: () => 'You are now friends',
    getRedirectLink: (userId) => `/profile/${userId}`
  },

  // Marketplace Notifications
  NEW_OFFER: {
    type: 'offer',
    icon: '💰',
    getTitle: (sender) => `New offer from ${sender}`,
    getDescription: (amount, productName) => `Offered $${amount} for ${productName}`,
    getRedirectLink: (productId) => `/marketplace/item/${productId}`
  },

  OFFER_ACCEPTED: {
    type: 'offer_accepted',
    icon: '🎉',
    getTitle: () => 'Your offer was accepted!',
    getDescription: (productName) => `Your offer for ${productName} was accepted`,
    getRedirectLink: (productId) => `/marketplace/item/${productId}`
  },

  OFFER_REJECTED: {
    type: 'offer_rejected',
    icon: '❌',
    getTitle: () => 'Offer declined',
    getDescription: (productName) => `Your offer for ${productName} was declined`,
    getRedirectLink: (productId) => `/marketplace/item/${productId}`
  },

  PRODUCT_MESSAGE: {
    type: 'product_message',
    icon: '📨',
    getTitle: (sender) => `Message from ${sender}`,
    getDescription: (productName) => `About: ${productName}`,
    getRedirectLink: (conversationId) => `/messages/${conversationId}`
  },

  PRODUCT_LIKED: {
    type: 'product_liked',
    icon: '⭐',
    getTitle: (sender) => `${sender} liked your item`,
    getDescription: (productName) => productName,
    getRedirectLink: (productId) => `/marketplace/item/${productId}`
  },

  PRODUCT_APPROVED: {
    type: 'product_approved',
    icon: '✅',
    getTitle: () => 'Item Approved',
    getDescription: (productName) => `Your item "${productName}" is now live on the marketplace`,
    getRedirectLink: (productId) => `/marketplace/item/${productId}`
  },

  PRODUCT_REJECTED: {
    type: 'product_rejected',
    icon: '⚠️',
    getTitle: () => 'Item Not Approved',
    getDescription: (productName, reason) => 
      `Your item "${productName}" was not approved. ${reason || 'Please review and resubmit.'}`,
    getRedirectLink: (productId) => `/marketplace/edit/${productId}`
  },

  // User Mentions
  MENTION: {
    type: 'mention',
    icon: '📢',
    getTitle: (sender) => `${sender} mentioned you`,
    getDescription: (content) => content || 'You were mentioned in a post',
    getRedirectLink: (postId) => `/post/${postId}`
  }
};

/**
 * Get notification configuration by type
 */
const getNotificationConfig = (type) => {
  const config = Object.values(NOTIFICATION_TYPES).find(nt => nt.type === type);
  return config || NOTIFICATION_TYPES.MESSAGE;
};

/**
 * Build notification object
 */
const buildNotification = (type, sender, recipient, data = {}) => {
  const config = getNotificationConfig(type);
  
  return {
    recipientId: recipient,
    senderId: sender,
    type: config.type,
    icon: config.icon,
    title: typeof config.getTitle === 'function' ? config.getTitle(data.senderName) : config.getTitle,
    description: typeof config.getDescription === 'function' 
      ? config.getDescription(...(data.descriptionArgs || [])) 
      : config.getDescription,
    redirectLink: typeof config.getRedirectLink === 'function' 
      ? config.getRedirectLink(...(data.redirectArgs || [])) 
      : config.getRedirectLink,
    message: data.message || '',
    postId: data.postId,
    productId: data.productId,
    commentId: data.commentId,
    conversationId: data.conversationId,
    metadata: data.metadata || {}
  };
};

module.exports = {
  NOTIFICATION_TYPES,
  getNotificationConfig,
  buildNotification
};
