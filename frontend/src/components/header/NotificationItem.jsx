import { useHistory } from 'react-router-dom';
import NotificationIcon from './NotificationIcon';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationItem({ notification, onClose }) {
  const history = useHistory();
  const { markAsRead, deleteNotification } = useNotifications();
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";

  const handleClick = async () => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification._id);
    }

    // Navigate to the redirect link
    if (notification.redirectLink) {
      history.push(notification.redirectLink);
      onClose && onClose();
    } else {
      // Default redirects based on type
      if (notification.postId) {
        history.push(`/post/${notification.postId}`);
      } else if (notification.productId) {
        history.push(`/marketplace/product/${notification.productId}`);
      } else if (notification.conversationId) {
        history.push(`/messenger?conversation=${notification.conversationId}`);
      } else {
        history.push('/notifications');
      }
      onClose && onClose();
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteNotification(notification._id);
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'like':
      case 'product_liked':
        return '#e74c3c';
      case 'comment':
        return '#3498db';
      case 'new_post':
        return '#9b59b6';
      case 'message':
      case 'product_message':
        return '#0084ff';
      case 'friend_request':
      case 'friend_accepted':
        return '#2ecc71';
      case 'offer':
      case 'offer_accepted':
        return '#f39c12';
      case 'offer_rejected':
      case 'product_rejected':
        return '#e74c3c';
      case 'product_approved':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const formatTimestamp = (date) => {
    try {
      const timestamp = new Date(date);
      const now = new Date();
      const diffInSeconds = Math.floor((now - timestamp) / 1000);

      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return timestamp.toLocaleDateString();
    } catch {
      return 'recently';
    }
  };

  return (
    <div 
      className={`notificationItem ${!notification.read ? 'unread' : ''}`}
      onClick={handleClick}
    >
      {/* Notification Icon & Avatar */}
      <div className="notificationAvatar">
        {notification.senderId?.profilePicture ? (
          <img 
            src={
              notification.senderId.profilePicture.startsWith("http") 
                ? notification.senderId.profilePicture 
                : PF + notification.senderId.profilePicture
            } 
            alt={notification.senderId.username}
            className="notificationUserImage"
            onError={(e) => {
              e.target.src = PF + "person/noAvatar.png";
            }}
          />
        ) : (
          <div className="notificationUserPlaceholder">
            {notification.senderId?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div 
          className="notificationIconBadge"
          style={{ backgroundColor: getNotificationColor() }}
        >
          <NotificationIcon type={notification.type} />
        </div>
      </div>

      {/* Notification Content */}
      <div className="notificationItemContent">
        <div className="notificationHeader">
          <span className="notificationTitle">{notification.title}</span>
          <button 
            className="deleteNotificationButton"
            onClick={handleDelete}
            aria-label="Delete notification"
          >
            ×
          </button>
        </div>
        
        <p className="notificationMessage">{notification.message}</p>
        
        {notification.description && (
          <p className="notificationDescription">{notification.description}</p>
        )}
        
        <div className="notificationFooter">
          <span className="notificationTime">
            {formatTimestamp(notification.createdAt)}
          </span>
          {!notification.read && (
            <span className="notificationUnreadDot"></span>
          )}
        </div>
      </div>
    </div>
  );
}
