import React from "react";
import Topbar from "../topbar/Topbar";
import Sidebar from "../sidebar/Sidebar";

export default function Layout({ children }) {

  return (
    <>
      <Topbar />
      <div className={`flex w-full min-h-[calc(100vh-56px)] pt-[50px] bg-[#f0f2f5]`}>
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
}
