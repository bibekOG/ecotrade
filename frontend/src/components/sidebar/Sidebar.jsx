import "./sidebar.css";
import { useContext, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import {
  Store,
  Home,
  People,
  Chat,
  Person,
  BusinessCenter,
  ExitToApp,
} from "@material-ui/icons";
import { Users } from "../../dummyData";
import CloseFriend from "../closeFriend/CloseFriend";
import { AuthContext } from "../../context/AuthContext";
import { Security } from "@material-ui/icons";

export default function Sidebar({ compact = false }) {
  const [showAllFriends, setShowAllFriends] = useState(false);
  const { user, dispatch } = useContext(AuthContext);
  const history = useHistory();
  const visibleFriends = showAllFriends ? Users : Users.slice(0, 6);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    history.push("/login");
  };

  return (
    <div className={`sidebar ${compact ? "compact" : ""}`}>
      <div className="sidebarWrapper">
        <ul className="sidebarList">
       
          <li className="sidebarListItem">
            <Link to="/" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
              <Home className="sidebarIcon" />
              {!compact && <span className="sidebarListItemText">Feed</span>}
            </Link>
          </li>
          <li className="sidebarListItem">
            <Link to="/friends" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
              <People className="sidebarIcon" />
              {!compact && <span className="sidebarListItemText">Friends</span>}
            </Link>
          </li>
             <li className="sidebarListItem">
            <Link to="/marketplace" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
              <Store className="sidebarIcon" />
              {!compact && <span className="sidebarListItemText">Marketplace</span>}
            </Link>
          </li>
          <li className="sidebarListItem">
            <Link to="/messenger" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
              <Chat className="sidebarIcon" />
              {!compact && <span className="sidebarListItemText">Chat</span>}
            </Link>
          </li>
          <li className="sidebarListItem">
            <Link to={user ? `/profile/${user.username}` : "/login"} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
              <Person className="sidebarIcon" />
              {!compact && <span className="sidebarListItemText">My Profile</span>}
            </Link>
          </li>
          <li className="sidebarListItem">
            <Link to="/trade" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
              <BusinessCenter className="sidebarIcon" />
              {!compact && <span className="sidebarListItemText">Trade Centre</span>}
            </Link>
          </li>
          {user?.isAdmin && (
            <li className="sidebarListItem">
              <Link to="/admin" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center" }}>
                <Security className="sidebarIcon" />
                {!compact && <span className="sidebarListItemText">Admin</span>}
              </Link>
            </li>
          )}
          <li className="sidebarListItem logoutItem" onClick={handleLogout}>
            <ExitToApp className="sidebarIcon" />
            {!compact && <span className="sidebarListItemText">Logout</span>}
          </li>
        </ul>
        {!compact && (
          <>
            <button className="sidebarButton" onClick={() => setShowAllFriends((prev) => !prev)}>
              {showAllFriends ? "Show Less" : "Show More"}
            </button>
            
         
             
          </>
        )}
      </div>
    </div>
  );
}
