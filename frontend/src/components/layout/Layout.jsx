import React from "react";
import { useLocation } from "react-router-dom";
import Header from "../header/Header";
import Sidebar from "../sidebar/Sidebar";
import "./layout.css";

export default function Layout({ children }) {
  const location = useLocation();
  const isCompactLayout = location.pathname === "/messenger" || location.pathname === "/trade";

  return (
    <>
      <Header />
      <div className={`layoutContainer ${isCompactLayout ? "compact" : ""}`}>
        <Sidebar compact={isCompactLayout} />
        <div className="mainContent">
          {children}
        </div>
      </div>
    </>
  );
}
