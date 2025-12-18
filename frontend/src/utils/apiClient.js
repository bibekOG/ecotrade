import axios from "axios";

const apiBaseURL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "/api";

const apiClient = axios.create({
  baseURL: apiBaseURL,
});

export default apiClient;

