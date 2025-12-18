import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationItem from '../../components/header/NotificationItem';
import { useNotifications } from '../../context/NotificationContext';
import './NotificationsPage.css';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead,
    deleteAllRead
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchNotifications(page, 20);
  }, [page, fetchNotifications]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteAllRead = async () => {
    if (window.confirm('Are you sure you want to delete all read notifications?')) {
      await deleteAllRead();
    }
  };

  return (
    <div className="notificationsPage">
      <div className="notificationsContainer">
        {/* Header */}
        <div className="notificationsPageHeader">
          <div className="notificationsPageTitle">
            <button 
              className="backButton"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <svg fill="currentColor" viewBox="0 0 20 20" width="24" height="24">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unreadBadge">{unreadCount} unread</span>
            )}
          </div>

          {/* Actions */}
          <div className="notificationsActions">
            {unreadCount > 0 && (
              <button 
                className="actionButton primaryAction"
                onClick={handleMarkAllAsRead}
              >
                <svg fill="currentColor" viewBox="0 0 20 20" width="18" height="18">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Mark all as read
              </button>
            )}
            {notifications.some(n => n.read) && (
              <button 
                className="actionButton secondaryAction"
                onClick={handleDeleteAllRead}
              >
                <svg fill="currentColor" viewBox="0 0 20 20" width="18" height="18">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete read
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="notificationFilters">
          <button 
            className={`filterTab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button 
            className={`filterTab ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`filterTab ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="notificationsListPage">
          {loading && notifications.length === 0 ? (
            <div className="notificationsLoading">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notificationsEmpty">
              <svg fill="currentColor" viewBox="0 0 20 20" width="80" height="80">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              <h2>
                {filter === 'unread' && 'No unread notifications'}
                {filter === 'read' && 'No read notifications'}
                {filter === 'all' && 'No notifications yet'}
              </h2>
              <p>
                {filter === 'all' 
                  ? 'When you get notifications, they'll show up here'
                  : 'Change filter to see other notifications'
                }
              </p>
            </div>
          ) : (
            <>
              {filteredNotifications.map((notification) => (
                <NotificationItem 
                  key={notification._id} 
                  notification={notification}
                />
              ))}

              {/* Load More Button */}
              {!loading && filteredNotifications.length >= 20 * page && (
                <div className="loadMoreContainer">
                  <button 
                    className="loadMoreButton"
                    onClick={() => setPage(prev => prev + 1)}
                  >
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
