import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import "./index.css";
import App from "./App";
import { AuthContextProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

// Ensure every axios call points at the API server (dev proxy or prod URL)
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "/api";

axios.defaults.baseURL = API_BASE_URL;

// Prevent runtime errors if any bundle references process in the browser
// without CRA inlining it
if (typeof window !== "undefined" && typeof window.process === "undefined") {
  window.process = { env: {} };
}

ReactDOM.render(
  <React.StrictMode>
    <AuthContextProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
