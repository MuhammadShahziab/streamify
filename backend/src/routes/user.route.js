import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getNotifications,
  getOutGoingFriendReqs,
  getRecommendedUsers,
  markNotificationsAsRead,
  rejectFriendRequest,
  sendFriendRequest,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute)

router.get("/",getRecommendedUsers);
router.get("/friends",getMyFriends);
router.post("/friend-request/:id",sendFriendRequest);
router.post("/friend-request/:id/accept",acceptFriendRequest);
router.post("/friend-request/:id/reject",rejectFriendRequest);
router.get("/friend-requests",getFriendRequests);
router.get("/outgoing-friend-requests",getOutGoingFriendReqs)
router.get("/notifications",getNotifications);
router.post("/notifications/mark-read", markNotificationsAsRead);

export default router;