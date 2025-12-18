import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getProfileImageUrl } from "../../utils/imageUtils";
import apiClient from "../../utils/apiClient";
import "./conversations.css";

export const Conversations = ({
  conversation,
  currentUser,
  onlineUsers = [],
  isActive = false,
  searchQuery = "",
  unreadCount = 0,
  lastMessage = null,
  onVisibilityChange
}) => {
  const { user } = useContext(AuthContext);
  const [otherUser, setOtherUser] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  const otherUserId = conversation.members.find((member) => member !== currentUser._id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (onVisibilityChange) {
          onVisibilityChange(entry.isIntersecting);
        }
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const element = document.querySelector(`[data-conversation-id="${conversation._id}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [conversation._id, onVisibilityChange]);

  useEffect(() => {
    const fetchOtherUser = async () => {
      if (!otherUserId || !currentUser) return;
      try {
        const res = await apiClient.get(`/users?userId=${otherUserId}`);
        setOtherUser(res.data);
      } catch (error) {
        console.error("Error fetching other user:", error);
      }
    };

    fetchOtherUser();
  }, [otherUserId, currentUser]);

  if (!otherUser) {
    return (
      <div className="conversation" data-conversation-id={conversation._id}>
        <div className="conversationImgContainer">
          <div className="conversationImg skeleton" />
        </div>
        <div className="conversationContent">
          <div className="conversationHeader">
            <div className="conversationName skeleton" />
            <div className="conversationTime skeleton" />
          </div>
          <div className="conversationFooter">
            <div className="conversationLastMessage skeleton" />
          </div>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers.includes(otherUser._id);
  const hasUnread = unreadCount > 0;
  const messageTime = lastMessage ? new Date(lastMessage.createdAt) : new Date(conversation.updatedAt || conversation.createdAt);
  const timeAgo = getTimeAgo(messageTime);
  const lastMessageText = lastMessage?.text || "No messages yet";
  const matchesSearch = !searchQuery || otherUser.username.toLowerCase().includes(searchQuery.toLowerCase());

  if (!matchesSearch) return null;

  return (
    <div
      className={`conversation ${isActive ? "active" : ""} ${hasUnread ? "hasUnread" : ""}`}
      role="button"
      tabIndex={0}
      data-conversation-id={conversation._id}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="conversationImgContainer">
        <img
          src={getProfileImageUrl(otherUser.profilePicture)}
          alt={otherUser.username}
          className="conversationImg"
        />
        {isOnline && <div className="conversationOnlineBadge" />}
        {hasUnread && unreadCount > 0 && (
          <div className="conversationUnreadBadge">{unreadCount > 99 ? "99+" : unreadCount}</div>
        )}
      </div>

      <div className="conversationContent">
        <div className="conversationHeader">
          <h3 className="conversationName">{otherUser.username}</h3>
          <span className="conversationTime">{timeAgo}</span>
        </div>

        <div className="conversationFooter">
          <p className={`conversationLastMessage ${hasUnread ? "unread" : ""}`}>
            {lastMessageText.length > 30 ? `${lastMessageText.substring(0, 30)}...` : lastMessageText}
          </p>
          {isOnline && <div className="onlineIndicator" />}
        </div>
      </div>
    </div>
  );
};

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}
