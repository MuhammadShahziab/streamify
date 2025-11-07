import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import {app , server} from "./socket/socketio.js";
// const app = express();
app.use(express.json());
dotenv.config();
const PORT = process.env.PORT || 5000;
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // allow frontend to send cookies
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes)

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
