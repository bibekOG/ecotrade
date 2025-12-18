/**
 * Notification Page Component
 * Full page view of all notifications with filtering and actions
 */

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';
import './NotificationPage.css';

const NotificationPage = () => {
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
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const loadNotifications = async (pageNum) => {
    const data = await fetchNotifications(pageNum, 20);
    if (data) {
      setHasMore(data.pagination.hasMore);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadNotifications(nextPage);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteAllRead = async () => {
    if (window.confirm('Are you sure you want to delete all read notifications?')) {
      await deleteAllRead();
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'read') return notif.read;
    return true;
  });

  return (
    <div className="notification-page">
      <div className="notification-page-container">
        {/* Header */}
        <div className="notification-page-header">
          <div className="header-left">
            <h1>Notifications</h1>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} new</span>
            )}
          </div>
          
          <div className="header-actions">
            {unreadCount > 0 && (
              <button 
                className="action-btn primary"
                onClick={handleMarkAllRead}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark all read
              </button>
            )}
            
            {notifications.some(n => n.read) && (
              <button 
                className="action-btn secondary"
                onClick={handleDeleteAllRead}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear read
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="notification-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({notifications.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Read ({notifications.length - unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="notification-page-body">
          {loading && page === 1 ? (
            <div className="notification-loading">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notification-empty">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h2>No notifications</h2>
              <p>
                {filter === 'unread' 
                  ? "You're all caught up!" 
                  : filter === 'read'
                  ? "No read notifications"
                  : "We'll notify you when something arrives!"}
              </p>
            </div>
          ) : (
            <>
              <div className="notification-list-full">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification._id}
                    notification={notification}
                  />
                ))}
              </div>

              {hasMore && filter === 'all' && (
                <div className="load-more-container">
                  <button 
                    className="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
