import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const url =
  process.env.NODE_ENV === "production"
    ? "https://streamify-app.com"
    : "http://localhost:5173";
const io = new Server(server, {
  cors: {
    origin: url,
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User Id=${userId} connected with Socket Id = ${socket.id}`);
  }
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  io.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
      console.log(
        `User Id=${userId} and Socket Id = ${socket.id} disconnected`
      );
    }
   io.emit("getOnlineUsers", Object.keys(userSocketMap));

  });
});

export { server, io, app };