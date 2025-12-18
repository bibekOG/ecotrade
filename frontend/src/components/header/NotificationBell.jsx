import { useState, useRef, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { Notifications } from "@material-ui/icons";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "../../context/NotificationContext";
import "./header.css";

export default function NotificationBell() {
  const { notifications, unreadCount } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [animate, setAnimate] = useState(false);
  const dropdownRef = useRef(null);
  const history = useHistory();

  // Animate badge when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDropdown]);

  // Debug: log notification count
  useEffect(() => {
    console.log(`NotificationBell: unreadCount = ${unreadCount}, total notifications = ${notifications.length}`);
  }, [unreadCount, notifications.length]);

  const handleDropdownToggle = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="notificationBell" ref={dropdownRef}>
      <div
        className={`notificationIconWrapper ${animate ? "animate" : ""}`}
        onClick={handleDropdownToggle}
      >
        <Notifications className="notificationIcon" />
        {unreadCount > 0 && (
          <span className={`notificationBadge ${animate ? "badgePulse" : ""}`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {showDropdown && (
        <NotificationDropdown onClose={() => setShowDropdown(false)} />
      )}
    </div>
  );
}
