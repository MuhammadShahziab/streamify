import FriendRequest from "../models/FriendRequest.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getReceverSocketId, io } from "../socket/socketio.js";

const USER_NOTIFICATION_FIELDS =
  "fullName profilePic bio nativeLanguage learningLanguage";

const notificationPopulateConfig = {
  path: "friendRequest",
  populate: [
    { path: "sender", select: USER_NOTIFICATION_FIELDS },
    { path: "recipient", select: USER_NOTIFICATION_FIELDS },
  ],
};

const buildNotificationPayload = async (notificationId) => {
  if (!notificationId) return null;
  return Notification.findById(notificationId)
    .populate(notificationPopulateConfig)
    .lean();
};

const emitRealtimeNotification = async (userId, notificationId) => {
  const receiverSocketId = getReceverSocketId(userId?.toString());
  if (!receiverSocketId) return;

  const notification = await buildNotificationPayload(notificationId);
  if (notification) {
    io.to(receiverSocketId).emit("notification:new", notification);
  }
};

export const getRecommendedUsers = async (req, res) => {
  try {
    const currentUser = req.user;
    const currentUserId = currentUser._id;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnBoarded: true },
      ],
    });
    return res.status(200).json({ recommendedUsers });
  } catch (error) {
    console.log("Error in getRecommendedUsers controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      "friends",
      "fullName profilePic nativeLanguage learningLanguage"
    );
    if (!user) {
      return res.status(201).json({ message: "You have no friends yet" });
    }
    res.status(200).json(user.friends);
  } catch (error) {
    console.log("Error in getMyFriends controller", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const sendFriendRequest = async (req, res) => {
  try {
    const { id: recipientId } = req.params;
    const currentUser = req.user;
    const senderId = currentUser._id;
    if (recipientId.toString() === senderId.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot send friend request to yourself" });
    }
    if (currentUser.friends.includes(recipientId)) {
      return res.status(400).json({ message: "You are already friends" });
    }
    // Check if a friend request already exists
    const existingReq = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId },
        { sender: recipientId, recipient: senderId },
      ],
    });

    if (existingReq) {
      return res.status(400).json({ message: "Friend request already exists" });
    }

    const createNewReq = await FriendRequest.create({
      sender: senderId,
      recipient: recipientId,
    });

    const notification = await Notification.create({
      user: recipientId,
      friendRequest: createNewReq._id,
      type: "friend_request",
    });

    await emitRealtimeNotification(recipientId, notification._id);
    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.log("Error in sendFriendRequest controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const currentUser = req.user;
    const userId = currentUser._id;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }
    if (friendRequest.recipient.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to accept this friend request",
      });
    }
    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        message: `You have already ${friendRequest.status} this request`,
      });
    }
    friendRequest.status = "accepted";
    await friendRequest.save();

    //Update both users friends list
    await User.findByIdAndUpdate(
      friendRequest.sender,
      {
        $addToSet: { friends: friendRequest.recipient },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(
      friendRequest.recipient,
      {
        $addToSet: { friends: friendRequest.sender },
      },
      { new: true }
    );

    const notification = await Notification.create({
      user: friendRequest.sender,
      friendRequest: friendRequest._id,
      type: "friend_request_accepted",
    });
    await emitRealtimeNotification(friendRequest.sender, notification._id);

    return res
      .status(200)
      .json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const rejectFriendRequest = async (req, res) => {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    await FriendRequest.findByIdAndDelete(requestId);
    return res
      .status(200)
      .json({ success: true, message: "Friend request rejected" });
  } catch (error) {
    console.log("Error in rejectFriendRequest controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const incomingReqs = await FriendRequest.find({
      recipient: userId,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilePic bio nativeLanguage learningLanguage"
    );
    const acceptedReqs = await FriendRequest.find({
      sender: userId,
      status: "accepted",
    }).populate(
      "recipient",
      "fullName profilePic bio nativeLanguage learningLanguage"
    );

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getFriendRequests controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOutGoingFriendReqs = async (req, res) => {
  try {
    const userId = req.user._id;
    const outgoingRequests = await FriendRequest.find({
      sender: userId,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilePic bio nativeLanguage learningLanguage"
    );
    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ user: userId })
      .populate(notificationPopulateConfig)
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.log("Error in getNotifications controller", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const notifications = await Notification.find({ user: userId })
      .populate(notificationPopulateConfig)
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.log("Error in markNotificationsAsRead controller", error);
    res.status(500).json({ message: "Server error" });
  }
};
