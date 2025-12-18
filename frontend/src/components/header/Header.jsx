import { Link } from "react-router-dom";
import SearchBar from "./SearchBar";
import NavIcons from "./NavIcons";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import "./header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="headerContainer">
        {/* Logo Section */}
        <div className="headerLeft">
          <Link to="/" className="logoLink">
            <img
              src="/assets/LogoImg.png"
              alt="ReadersRoom Logo"
              className="headerLogo"
            />
          
          </Link>
        </div>

        {/* Search Bar Section */}
        <div className="headerCenter">
          <SearchBar />
        </div>

        {/* Right Section - Nav Icons, Notifications, Profile */}
        <div className="headerRight">
          <NavIcons />
          <NotificationBell />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}

