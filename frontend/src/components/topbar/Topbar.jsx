import { Search, Person, Chat, Notifications, ExitToApp, Home } from "@material-ui/icons";
import { Link, useHistory } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiClient from "../../utils/apiClient";
import { getProfileImageUrl } from "../../utils/imageUtils";

export default function Topbar() {
  const { user, dispatch } = useContext(AuthContext);
  const history = useHistory();
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";

  const [searchQuery, setSearchQuery] = useState("");
  const [friendRequests, setFriendRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (user && user._id) {
      fetchFriendRequests();
      fetchNotifications();
      fetchUnreadMessages();

      const notificationInterval = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => clearInterval(notificationInterval);
    }
  }, [user]);

  const fetchFriendRequests = async () => {
    if (!user?._id) return;
    try {
      const res = await apiClient.get(`/friends/friend-requests/received/${user._id}`);
      setFriendRequests(res.data);
    } catch (err) {
      console.error("Error fetching friend requests:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!user?._id) return;
    try {
      const res = await apiClient.get(`/notifications`, { params: { userId: user._id } });
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        console.warn("Notifications response is not an array:", res.data);
        setNotifications([]);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotifications([]);
    }
  };

  const fetchUnreadMessages = async () => {
    if (!user?._id) return;
    try {
      const res = await apiClient.get(`/conversations/unread/${user._id}`);
      setUnreadMessages(res.data.length);
    } catch (err) {
      console.error("Error fetching unread messages:", err);
    }
  };

  const unreadNotificationsCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      history.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    history.push("/login");
  };

  return (
    <div className="h-14 w-full bg-white flex items-center fixed top-0 z-50 shadow-sm px-4">
      {/* Left: Logo */}
      <div className="flex-none w-[280px] flex items-center">
        <Link to="/" className="no-underline">
          <span className="text-2xl font-extrabold text-[#1877f2] cursor-pointer tracking-tighter">
            EcoTrade
          </span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center px-4 hidden md:flex">
        <form onSubmit={handleSearch} className="w-full max-w-[600px] h-10 bg-[#f0f2f5] rounded-full flex items-center px-4">
          <Search className="text-gray-500 !text-[22px] mr-2" />
          <input
            placeholder="Search EcoTrade"
            className="border-none w-full bg-transparent text-[15px] text-gray-900 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Right: Icons & Profile */}
      <div className="flex-none flex items-center justify-end gap-x-2 ml-auto">
        {/* Mobile Home Icon */}
        <div className="md:hidden w-10 h-10 rounded-full bg-[#f0f2f5] flex items-center justify-center cursor-pointer hover:bg-[#d8dadf] transition-colors text-gray-700" onClick={() => history.push("/")}>
          <Home />
        </div>

        <div className="flex items-center gap-x-2">
          {/* Friend Requests */}
          <div className="relative w-10 h-10 rounded-full bg-[#f0f2f5] flex items-center justify-center cursor-pointer hover:bg-[#d8dadf] transition-colors text-gray-700" onClick={() => history.push("/friends")}>
            <Person className="!text-[24px]" />
            {friendRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 w-[19px] h-[19px] bg-[#e41e3f] rounded-full text-white flex items-center justify-center text-[11px] font-bold border-2 border-white">
                {friendRequests.length}
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="relative w-10 h-10 rounded-full bg-[#f0f2f5] flex items-center justify-center cursor-pointer hover:bg-[#d8dadf] transition-colors text-gray-700" onClick={() => history.push("/messenger")}>
            <Chat className="!text-[22px]" />
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-[19px] h-[19px] bg-[#e41e3f] rounded-full text-white flex items-center justify-center text-[11px] font-bold border-2 border-white">
                {unreadMessages}
              </span>
            )}
          </div>

          {/* Notifications */}
          <div className="relative w-10 h-10 rounded-full bg-[#f0f2f5] flex items-center justify-center cursor-pointer hover:bg-[#d8dadf] transition-colors text-gray-700" onClick={() => history.push("/notifications")}>
            <Notifications className="!text-[24px]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-[19px] h-[19px] bg-[#e41e3f] rounded-full text-white flex items-center justify-center text-[11px] font-bold border-2 border-white">
                {unreadNotificationsCount}
              </span>
            )}
          </div>

          {/* Logout */}
          <div className="w-10 h-10 rounded-full bg-[#f0f2f5] flex items-center justify-center cursor-pointer hover:bg-[#d8dadf] transition-colors text-gray-700 group relative" onClick={handleLogout}>
            <ExitToApp className="!text-[24px]" />
            {/* Tooltip via Tailwind Group Hover */}
            <span className="absolute top-12 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              Logout
            </span>
          </div>
        </div>

        {/* Profile Pic */}
        <Link to={`/profile/${user?.username}`} className="flex items-center">
          <img
            src={getProfileImageUrl(user?.profilePicture)}
            alt=""
            className="w-10 h-10 rounded-full object-cover border border-gray-200 ml-2 cursor-pointer bg-gray-200"
            onError={(e) => { e.target.src = getProfileImageUrl("person/noAvatar.png"); }}
          />
        </Link>
      </div>
    </div>
  );
}
