/**
 * Notification Configuration
 * Frontend configuration for notification types and icons
 */

export const NOTIFICATION_ICONS = {
  message: '💬',
  like: '❤️',
  comment: '💭',
  new_post: '📝',
  friend_request: '👤',
  friend_accepted: '✅',
  offer: '💰',
  offer_accepted: '🎉',
  offer_rejected: '❌',
  product_message: '📨',
  product_liked: '⭐',
  product_approved: '✅',
  product_rejected: '⚠️',
  mention: '📢'
};

export const NOTIFICATION_COLORS = {
  message: '#0084ff',
  like: '#e74c3c',
  comment: '#3498db',
  new_post: '#9b59b6',
  friend_request: '#9b59b6',
  friend_accepted: '#2ecc71',
  offer: '#f39c12',
  offer_accepted: '#27ae60',
  offer_rejected: '#e67e22',
  product_message: '#1abc9c',
  product_liked: '#f1c40f',
  product_approved: '#2ecc71',
  product_rejected: '#e74c3c',
  mention: '#34495e'
};

export const getNotificationIcon = (type) => {
  return NOTIFICATION_ICONS[type] || '🔔';
};

export const getNotificationColor = (type) => {
  return NOTIFICATION_COLORS[type] || '#3498db';
};

export const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const notificationDate = new Date(timestamp);
  const seconds = Math.floor((now - notificationDate) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
};
