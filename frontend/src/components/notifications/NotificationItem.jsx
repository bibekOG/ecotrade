/**
 * Notification Item Component
 * Individual notification display with actions
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { getNotificationIcon, formatTimeAgo } from '../../utils/notificationConfig';
import './NotificationItem.css';

const NotificationItem = ({ notification, onClose, compact = false }) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = async () => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate to the relevant page
    if (notification.redirectLink) {
      navigate(notification.redirectLink);
      if (onClose) onClose();
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteNotification(notification._id);
  };

  const icon = getNotificationIcon(notification.type);
  const senderName = notification.senderId?.fullName || notification.senderId?.username || 'Someone';
  const senderAvatar = notification.senderId?.profilePicture || '/assets/person/noAvatar.png';
  const timeAgo = formatTimeAgo(notification.createdAt);

  return (
    <div 
      className={`notification-item ${!notification.read ? 'unread' : ''} ${compact ? 'compact' : ''}`}
      onClick={handleClick}
    >
      <div className="notification-avatar">
        <img src={senderAvatar} alt={senderName} />
        <span className="notification-icon-badge">{icon}</span>
      </div>

      <div className="notification-content">
        <div className="notification-header">
          <h4 className="notification-title">{notification.title}</h4>
          {!notification.read && <span className="unread-dot"></span>}
        </div>
        
        <p className="notification-description">
          {notification.description || notification.message}
        </p>
        
        <span className="notification-time">{timeAgo}</span>
      </div>

      {!compact && (
        <button 
          className="notification-delete-btn"
          onClick={handleDelete}
          aria-label="Delete notification"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default NotificationItem;
