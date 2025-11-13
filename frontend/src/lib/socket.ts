import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useOnlineUsersStore } from "../store/useOnlineUsersStore";
import { useNotificationStore } from "../store/useNotificationStore";
import type { AppNotification } from "../types";

const mode = import.meta.env.VITE_CLIENT_MODE || "development";

const SOCKET_URL =
  mode === "production"
    ? "https://streamify-backend.onrender.com"
    : "http://localhost:5001";

export const SocketClient = (userId: string, isVerified: boolean) => {
  const setOnlineUsers = useOnlineUsersStore((s) => s.setOnlineUsers);
  const upsertNotification = useNotificationStore(
    (state) => state.upsertNotification
  );
  useEffect(() => {
    let socketio: Socket | null = null;
    if (isVerified) {
      socketio = io(SOCKET_URL, {
        query: {
          userId,
        },
        transports: ["websocket"],
      });
      // get online users from socket server and set to zustand store
      socketio.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
        console.log(users, "Online Users from SocketClient");
      });
      socketio.on("notification:new", (notification: AppNotification) => {
        upsertNotification(notification);
      });
    }
    return () => {
      if (socketio) {
        socketio.disconnect();
      }
    };
  }, [isVerified, userId, setOnlineUsers, upsertNotification]);
};
