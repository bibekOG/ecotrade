import { useState, useRef, useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import {
  Person,
  Settings,
  ExitToApp,
  BusinessCenter,
  Security,
} from "@material-ui/icons";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./header.css";

export default function ProfileMenu() {
  const { user, dispatch } = useContext(AuthContext);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const history = useHistory();
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    history.push("/login");
  };

  if (!user) return null;

  return (
    <div className="profileMenu" ref={menuRef}>
      <div
        className="profileMenuTrigger"
        onClick={() => setShowMenu(!showMenu)}
      >
        <img
          src={
            user.profilePicture
              ? user.profilePicture.startsWith("http")
                ? user.profilePicture
                : PF + user.profilePicture
              : PF + "person/noAvatar.png"
          }
          alt={user.username}
          className="profileMenuAvatar"
          onError={(e) => {
            e.target.src = PF + "person/noAvatar.png";
          }}
        />
      </div>

      {showMenu && (
        <div className="profileMenuDropdown">
          <div className="profileMenuHeader">
            <img
              src={
                user.profilePicture
                  ? user.profilePicture.startsWith("http")
                    ? user.profilePicture
                    : PF + user.profilePicture
                  : PF + "person/noAvatar.png"
              }
              alt={user.username}
              className="profileMenuHeaderAvatar"
              onError={(e) => {
                e.target.src = PF + "person/noAvatar.png";
              }}
            />
            <div className="profileMenuHeaderInfo">
              <p className="profileMenuName">{user.fullName || user.username}</p>
              <p className="profileMenuUsername">@{user.username}</p>
            </div>
          </div>

          <div className="profileMenuItems">
            <Link
              to={`/profile/${user.username}`}
              className="profileMenuItem"
              onClick={() => setShowMenu(false)}
            >
              <Person className="profileMenuIcon" />
              <span>My Profile</span>
            </Link>

            <Link
              to="/trade"
              className="profileMenuItem"
              onClick={() => setShowMenu(false)}
            >
              <BusinessCenter className="profileMenuIcon" />
              <span>Trade Centre</span>
            </Link>

            {user.isAdmin && (
              <Link
                to="/admin"
                className="profileMenuItem"
                onClick={() => setShowMenu(false)}
              >
                <Security className="profileMenuIcon" />
                <span>Admin Panel</span>
              </Link>
            )}

            <div className="profileMenuDivider" />

            <div className="profileMenuItem" onClick={handleLogout}>
              <ExitToApp className="profileMenuIcon" />
              <span>Logout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

