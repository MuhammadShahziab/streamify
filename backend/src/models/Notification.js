import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    friendRequest: {
      type: mongoose.Schema.ObjectId,
      ref: "FriendRequest",
      required: true,
    },
    type: {
      type: String,
      enum: ["friend_request", "friend_request_accepted"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
