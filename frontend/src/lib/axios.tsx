import axios from "axios";
import toast from "react-hot-toast";

import { useAuthStore } from "../store/useAuthStore";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001/api"
    : "/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const AUTH_ERROR_CODES = new Set([
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "TOKEN_MISSING",
  "USER_NOT_FOUND",
]);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error || {};
    if (!response) {
      return Promise.reject(error);
    }

    const { status, data } = response;
    const code: string | undefined = data?.code;

    if (status === 401 && code && AUTH_ERROR_CODES.has(code)) {
      const store = useAuthStore.getState();
      const { clearUser, setIsAuthenticated, user, isAuthenticated } = store;

      const hadVerifiedSession =
        Boolean(isAuthenticated) || Boolean(user?.isVerified);

      if (hadVerifiedSession) {
        clearUser();

        const message =
          code === "TOKEN_EXPIRED"
            ? "Your session expired. Please log in again."
            : "You have been signed out. Please log in.";

        toast.error(message);

        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.assign("/login");
        }
      } else {
        setIsAuthenticated(false);
      }
    }

    return Promise.reject(error);
  }
);
