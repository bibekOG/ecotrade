import { Link, useHistory } from "react-router-dom";
import {
  Home,
  People,
  Chat,
  Store,
  Person,
} from "@material-ui/icons";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./header.css";

export default function NavIcons() {
  const { user } = useContext(AuthContext);
  const history = useHistory();

  return (
    <div className="navIcons">
      <Link to="/" className="navIconLink" title="Home">
        <Home className="navIcon" />
      </Link>
      <Link to="/friends" className="navIconLink" title="Friends">
        <People className="navIcon" />
      </Link>
      <Link to="/messenger" className="navIconLink" title="Messages">
        <Chat className="navIcon" />
      </Link>
      <Link to="/marketplace" className="navIconLink" title="Marketplace">
        <Store className="navIcon" />
      </Link>
      <Link
        to={user ? `/profile/${user.username}` : "/login"}
        className="navIconLink"
        title="Profile"
      >
        <Person className="navIcon" />
      </Link>
    </div>
  );
}

