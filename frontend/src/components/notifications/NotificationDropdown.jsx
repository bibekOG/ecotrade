/**
 * Notification Dropdown Component
 * Displays a preview of recent notifications
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();

  const recentNotifications = notifications.slice(0, 5);

  const handleViewAll = () => {
    navigate('/notifications');
    onClose();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button 
            className="mark-all-read-btn"
            onClick={handleMarkAllRead}
            title="Mark all as read"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="notification-dropdown-body">
        {loading ? (
          <div className="notification-loading">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : recentNotifications.length === 0 ? (
          <div className="notification-empty">
            <svg 
              className="empty-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p>No notifications yet</p>
            <span>We'll notify you when something arrives!</span>
          </div>
        ) : (
          <div className="notification-list">
            {recentNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onClose={onClose}
                compact
              />
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notification-dropdown-footer">
          <button 
            className="view-all-btn"
            onClick={handleViewAll}
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
