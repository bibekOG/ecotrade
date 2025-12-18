import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "../../context/NotificationContext";
import "./header.css";

export default function NotificationBell() {
  const { unreadCount, fetchLatestNotifications } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > prevUnreadCount && unreadCount > 0) {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const toggleDropdown = () => {
    if (!showDropdown) {
      fetchLatestNotifications(5);
    }
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="notificationBellContainer" ref={dropdownRef}>
      <button
        className={`notificationBellButton ${animate ? 'bellAnimation' : ''}`}
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        {/* Bell Icon */}
        <svg 
          className="bellIcon" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          width="24"
          height="24"
        >
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="notificationBadge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <NotificationDropdown onClose={() => setShowDropdown(false)} />
      )}
    </div>
  );
}
