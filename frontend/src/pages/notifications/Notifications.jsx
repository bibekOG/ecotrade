import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import Layout from "../../components/layout/Layout";
import "./notifications.css";

export default function Notifications() {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [activeTab, setActiveTab] = useState("all");
  const [deleting, setDeleting] = useState(false);
  const history = useHistory();

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    if (notification.redirectLink) {
      history.push(notification.redirectLink);
    } else {
      // Default redirects based on type
      if (notification.postId) {
        history.push(`/post/${notification.postId}`);
      } else if (notification.productId) {
        history.push(`/marketplace/product/${notification.productId}`);
      } else if (notification.conversationId) {
        history.push(`/messenger?conversation=${notification.conversationId}`);
      }
    }
  };

  const deleteAllRead = async () => {
    try {
      setDeleting(true);
      const readNotifications = notifications.filter((n) => n.read);
      for (const notification of readNotifications) {
        await deleteNotification(notification._id);
      }
    } catch (err) {
      console.error("Error deleting read notifications:", err);
    } finally {
      setDeleting(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return "❤️";
      case "comment":
        return "💬";
      case "offer":
        return "💰";
      case "friend":
        return "👥";
      case "follow":
        return "👤";
      case "mention":
        return "📢";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "like":
        return "#ff6b6b";
      case "comment":
        return "#4ecdc4";
      case "offer":
        return "#45b7d1";
      case "friend":
        return "#96ceb4";
      case "follow":
        return "#feca57";
      case "mention":
        return "#ff9ff3";
      default:
        return "#feca57";
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotificationDisplayName = (notification) => {
    if (notification.senderId && notification.senderId.fullName) {
      return notification.senderId.fullName;
    }
    if (notification.senderId && notification.senderId.username) {
      return notification.senderId.username;
    }
    return "Someone";
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  const readCount = notifications.filter((n) => n.read).length;

  if (loading) {
    return (
      <Layout>
        <div className="notificationsPage">
          <div className="loading">Loading notifications...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="notificationsPage">
        <div className="notificationsHeader">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <div className="unreadCount">
              {unreadCount} unread
            </div>
          )}
        </div>

        <div className="notificationsTabs">
          <button 
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All ({notifications.length})
          </button>
          <button 
            className={`tab ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            Unread ({unreadCount})
          </button>
          <button 
            className={`tab ${activeTab === "like" ? "active" : ""}`}
            onClick={() => setActiveTab("like")}
          >
            Likes
          </button>
          <button 
            className={`tab ${activeTab === "comment" ? "active" : ""}`}
            onClick={() => setActiveTab("comment")}
          >
            Comments
          </button>
          <button 
            className={`tab ${activeTab === "offer" ? "active" : ""}`}
            onClick={() => setActiveTab("offer")}
          >
            Offers
          </button>
          <button 
            className={`tab ${activeTab === "friend" ? "active" : ""}`}
            onClick={() => setActiveTab("friend")}
          >
            Friend Requests
          </button>
        </div>

        <div className="notificationsActions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="markAllReadBtn">
              Mark all as read
            </button>
          )}
          {readCount > 0 && (
            <button 
              onClick={deleteAllRead} 
              className="deleteReadBtn"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : `Delete ${readCount} read`}
            </button>
          )}
        </div>

        <div className="notificationsList">
          {filteredNotifications.length === 0 ? (
            <div className="noNotifications">
              <div className="noNotificationsIcon">🔔</div>
              <h3>No notifications</h3>
              <p>You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`notificationItem ${!notification.read ? "unread" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div
                  className="notificationIcon"
                  style={{ backgroundColor: getNotificationColor(notification.type) }}
                >
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notificationContent">
                  <p className="notificationTitle">{notification.title}</p>
                  <p className="notificationMessage">{notification.message}</p>
                  {notification.description && (
                    <p className="notificationDescription">{notification.description}</p>
                  )}
                  <span className="notificationTime">
                    {formatTime(notification.createdAt)}
                  </span>
                </div>
                <div className="notificationActions">
                  {!notification.read && (
                    <button
                      className="markReadBtn"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="deleteBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    title="Delete notification"
                  >
                    ×
                  </button>
                </div>
                {!notification.read && <div className="unreadIndicator"></div>}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
