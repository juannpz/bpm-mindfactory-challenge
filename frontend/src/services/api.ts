import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("bpm_auth");
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === "undefined") return Promise.reject(error);
    const status = error.response?.status;

    // 401 → redirect to login
    if (status === 401) {
      const path = window.location.pathname;
      if (path === "/interno/login" || path === "/externo/login") {
        return Promise.reject(error);
      }
      if (path.startsWith("/interno")) {
        window.location.href = "/interno/login";
      } else if (path.startsWith("/externo")) {
        window.location.href = "/externo/login";
      }
      return Promise.reject(error);
    }

    // 403/404/422 → propagate to page-level handlers (snackbar)
    // The error message from the backend is already user-friendly
    return Promise.reject(error);
  },
);

export default api;
