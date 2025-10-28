import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";

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

    await createNewReq.save();
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

    return res
      .status(200)
      .json({ success:true, message: "Friend request accepted" });
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
      .json({ success:true, message: "Friend request rejected" });

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
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");
    const acceptedReqs = await FriendRequest.find({
      sender: userId,
      status: "accepted",}).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");
    
    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getFriendRequests controller", error);
    res.status(500).json({ message: "Server error" });
  }
}