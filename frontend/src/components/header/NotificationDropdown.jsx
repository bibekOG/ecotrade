import { useHistory } from 'react-router-dom';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../../context/NotificationContext';

export default function NotificationDropdown({ onClose }) {
  const history = useHistory();
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    await markAllAsRead();
  };

  const handleViewAll = (e) => {
    e.stopPropagation();
    history.push('/notifications');
    onClose();
  };

  return (
    <div className="notificationDropdown">
      {/* Header */}
      <div className="notificationDropdownHeader">
        <div className="notificationDropdownTitle">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="notificationDropdownBadge">{unreadCount}</span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button 
            className="markAllReadButton"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="notificationDropdownBody">
        {loading ? (
          <div className="notificationDropdownLoading">
            <div className="loadingSpinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notificationDropdownEmpty">
            <div className="noNotificationsIcon">🔔</div>
            <p>No notifications yet</p>
            <span>When you get notifications, they'll show up here</span>
          </div>
        ) : (
          <div className="notificationList">
            {notifications.slice(0, 5).map((notification) => (
              <NotificationItem 
                key={notification._id} 
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 5 && (
        <div className="notificationDropdownFooter">
          <button 
            className="viewAllButton"
            onClick={handleViewAll}
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
