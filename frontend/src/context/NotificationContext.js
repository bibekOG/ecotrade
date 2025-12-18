import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { io } from "socket.io-client";
import apiClient from "../utils/apiClient";
import { AuthContext } from "./AuthContext";

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
        loading: false,
      };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case "MARK_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif._id === action.payload
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case "MARK_ALL_AS_READ":
      return {
        ...state,
        notifications: state.notifications.map((notif) => ({
          ...notif,
          read: true,
          readAt: new Date(),
        })),
        unreadCount: 0,
      };
    case "DELETE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notif) => notif._id !== action.payload
        ),
        unreadCount: state.notifications.find((n) => n._id === action.payload && !n.read)
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "SET_UNREAD_COUNT":
      return {
        ...state,
        unreadCount: action.payload,
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    unreadCount: 0,
    loading: true,
  });

  // Initialize Socket.io connection
  useEffect(() => {
    if (user && user._id) {
      const newSocket = io("http://localhost:8900");
      setSocket(newSocket);

      // Join notification room
      newSocket.emit("joinNotificationRoom", user._id);

      // Listen for new notifications
      newSocket.on("newNotification", (notification) => {
        console.log("Received notification via Socket.io:", notification);
        
        // Handle different formats of recipientId
        let recipientId = null;
        if (notification.recipientId) {
          if (typeof notification.recipientId === 'object' && notification.recipientId._id) {
            recipientId = notification.recipientId._id.toString();
          } else {
            recipientId = notification.recipientId.toString();
          }
        }
        
        const currentUserId = user._id.toString();
        
        console.log(`Notification recipient: ${recipientId}, Current user: ${currentUserId}, Match: ${recipientId === currentUserId}`);
        
        if (recipientId && recipientId === currentUserId) {
          console.log("Adding notification to state:", notification.type);
          dispatch({ type: "ADD_NOTIFICATION", payload: notification });
          
          // Show browser notification if permission granted
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification(notification.title, {
                body: notification.message,
                icon: "/assets/LogoImg.png",
              });
            } catch (err) {
              console.error("Error showing browser notification:", err);
            }
          }
        } else {
          console.log("Notification not for current user, ignoring");
        }
      });

      return () => {
        newSocket.emit("leaveNotificationRoom", user._id);
        newSocket.close();
      };
    }
  }, [user]);

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (user && user._id) {
      fetchNotifications();
      
      // Request notification permission
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user || !user._id) return;

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await apiClient.get(`/notifications?userId=${user._id}`);

      let notifications = [];
      let unreadCountFromApi = null;

      if (Array.isArray(res.data)) {
        notifications = res.data;
      } else if (res.data && Array.isArray(res.data.notifications)) {
        notifications = res.data.notifications;
        if (typeof res.data.unreadCount === "number") {
          unreadCountFromApi = res.data.unreadCount;
        }
      }

      console.log(`Fetched ${notifications.length} notifications for user ${user._id}`);

      dispatch({ type: "SET_NOTIFICATIONS", payload: notifications });

      const unreadCount =
        unreadCountFromApi !== null
          ? unreadCountFromApi
          : notifications.filter((n) => !n.read).length;
      console.log(`Unread notification count: ${unreadCount}`);
      dispatch({ type: "SET_UNREAD_COUNT", payload: unreadCount });
    } catch (err) {
      console.error("Error fetching notifications:", err);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const markAsRead = async (notificationId) => {
    if (!user || !user._id) return;

    try {
      await apiClient.put(`/notifications/${notificationId}/read`, {
        userId: user._id,
      });
      dispatch({ type: "MARK_AS_READ", payload: notificationId });
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user || !user._id) return;

    try {
      await apiClient.put("/notifications/read-all", { userId: user._id });
      dispatch({ type: "MARK_ALL_AS_READ" });
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!user || !user._id) return;

    try {
      await apiClient.delete(`/notifications/${notificationId}`, {
        data: { userId: user._id },
      });
      dispatch({ type: "DELETE_NOTIFICATION", payload: notificationId });
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const value = {
    ...state,
    socket,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

