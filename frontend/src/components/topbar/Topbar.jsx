import "./topbar.css";
import { Search, Person, Chat, Notifications, ExitToApp } from "@material-ui/icons";
import { Link, useHistory } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiClient from "../../utils/apiClient";

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
      
      // Set up real-time updates for notifications
      const notificationInterval = setInterval(() => {
        fetchNotifications();
      }, 30000); // Check every 30 seconds
      
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
      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
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

  // Calculate unread notifications count
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

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
    <div className="topbarContainer">
      <div className="topbarLeft">
        <Link to="/" style={{ textDecoration: "none" }}>
          <img src="/assets/LogoImg.png" alt="EcoTrade Logo" className="facebookLogo"/>
          <span className="logo"></span>
        </Link>
      </div>
      <div className="topbarCenter">
        <form onSubmit={handleSearch} className="searchbar">
          <Search className="searchIcon" />
          <input
            placeholder="Search for friend, post or video"
            className="searchInput"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      <div className="topbarRight">
        <div className="topbarLinks">
          <Link to="/" className="topbarLink">Homepage</Link>
          <Link to={`/profile/${user?.username}`} className="topbarLink">Timeline</Link>
        </div>
        <div className="topbarIcons">
          <div className="topbarIconItem" onClick={() => history.push("/friends")}>
            <Person />
            <span className="topbarIconBadge">{friendRequests.length}</span>
            <span className="tooltip">Friend Requests</span>
          </div>
         
          <div className="topbarIconItem">
            <Link to="/messenger" style={{ textDecoration: "none", color: "#f1f1f1" }}>
              <Chat/>
            </Link>
            <span className="topbarIconBadge">{unreadMessages}</span>
            <span className="tooltip">Messages</span>
          </div>
          
          <div className="topbarIconItem" onClick={() => history.push("/notifications")}>
            <Notifications />
            <span className="topbarIconBadge">{unreadNotificationsCount}</span>
            <span className="tooltip">Notifications</span>
          </div>

          <div className="topbarIconItem logoutIcon" onClick={handleLogout}>
            <ExitToApp />
            <span className="logoutTooltip">Logout</span>
          </div>
        </div>
        <Link to={`/profile/${user?.username}`}>
          <img
            src={user?.profilePicture ? (user.profilePicture.startsWith('http') ? user.profilePicture : PF + user.profilePicture) : PF + "person/noAvatar.png"}
            alt=""
            className="topbarImg"
            onError={(e) => { e.target.src = PF + "person/noAvatar.png"; }}
          />
        </Link>
      </div>
    </div>
  );
}
