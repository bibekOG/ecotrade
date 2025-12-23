import { useContext, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import {
  Store,
  Home,
  People,
  Chat,
  Person,
  BusinessCenter,
  ExitToApp,
  Security,
} from "@material-ui/icons";
import { AuthContext } from "../../context/AuthContext";

export default function Sidebar() {
  const { user, dispatch } = useContext(AuthContext);
  const history = useHistory();
  const location = useLocation();

  const handleLogout = () => {
    dispatch({ type: "LOGOUT" });
    localStorage.removeItem("user");
    history.push("/login");
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      name: "Feed",
      path: "/",
      icon: Home,
      color: "text-blue-600",
      activeBg: "bg-blue-50",
      activeText: "text-blue-600",
    },
    {
      name: "Friends",
      path: "/friends",
      icon: People,
      color: "text-blue-600",
      activeBg: "bg-blue-50",
      activeText: "text-blue-600",
    },
    {
      name: "Marketplace",
      path: "/marketplace",
      icon: Store,
      color: "text-teal-500",
      activeBg: "bg-teal-50",
      activeText: "text-teal-600",
    },
    {
      name: "Chat",
      path: "/messenger",
      icon: Chat,
      color: "text-purple-500",
      activeBg: "bg-purple-50",
      activeText: "text-purple-600",
    },
    {
      name: "My Profile",
      path: user ? `/profile/${user.username}` : "/login",
      icon: Person,
      color: "text-gray-900",
      activeBg: "bg-gray-100",
      activeText: "text-gray-900",
    },
    {
      name: "Trade Centre",
      path: "/trade",
      icon: BusinessCenter,
      color: "text-yellow-500",
      activeBg: "bg-yellow-50",
      activeText: "text-yellow-600",
    },
    {
      name: "Admin",
      path: "/admin",
      icon: Security,
      color: "text-gray-600",
      activeBg: "bg-gray-100",
      activeText: "text-gray-800",
    },
  ];

  const iconStyle = "text-[28px]";

  return (
    <aside
      className={`sticky top-14 h-[calc(100vh-56px)] bg-white border-r border-gray-200 
      w-64 hidden md:block`}
    >
      <div className="p-4 space-y-2 overflow-y-auto h-full">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${active
                ? `${item.activeBg} ${item.activeText} shadow-sm`
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
            >
              <item.icon className={`${iconStyle} ${item.color}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Divider */}
        <div className="my-4 border-t border-gray-200" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-3 w-full rounded-xl font-medium
          text-red-600 bg-red-50 hover:bg-red-100 transition"
        >
          <ExitToApp className="text-[28px]" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
