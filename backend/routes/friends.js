const router = require("express").Router();
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const { createFriendRequestNotification, createFriendAcceptedNotification } = require("../utils/notificationService");

// Get user's friends
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate("friends", "username email profilePicture");
    if (!user) {
      return res.status(404).json("User not found");
    }
    res.status(200).json(user.friends);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Search users
router.get("/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length < 2) {
      return res.status(400).json("Search query must be at least 2 characters long");
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } }
      ]
    }).select("username email profilePicture fullName");

    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Send friend request
router.post("/friend-request", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (senderId === receiverId) {
      return res.status(400).json("You cannot send a friend request to yourself");
    }

    // Check if users exist
    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json("User not found");
    }

    // Check if they are already friends
    if (sender.friends.includes(receiverId)) {
      return res.status(400).json("You are already friends with this user");
    }

    // Check if a request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (existingRequest) {
      return res.status(400).json("Friend request already exists");
    }

    // Create new friend request
    const newRequest = new FriendRequest({
      sender: senderId,
      receiver: receiverId
    });

    const savedRequest = await newRequest.save();
    const populatedRequest = await FriendRequest.findById(savedRequest._id)
      .populate("sender", "username email profilePicture")
      .populate("receiver", "username email profilePicture");

    // Create notification for friend request (sent to receiver)
    try {
      const notification = await createFriendRequestNotification(senderId, receiverId);
      console.log(`Friend request notification created for user ${receiverId} from user ${senderId}`);
      if (!notification) {
        console.warn(`Failed to create friend request notification`);
      }
    } catch (notificationError) {
      console.error("Error creating friend request notification:", notificationError);
    }

    res.status(200).json(populatedRequest);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get received friend requests
router.get("/friend-requests/received/:userId", async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.params.userId,
      status: "Pending"
    }).populate("sender", "username email profilePicture");

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get sent friend requests
router.get("/friend-requests/sent/:userId", async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.params.userId,
      status: "Pending"
    }).populate("receiver", "username email profilePicture");

    res.status(200).json(requests);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Accept friend request
router.put("/friend-request/:requestId/accept", async (req, res) => {
  try {
    const { userId } = req.body;
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json("Friend request not found");
    }

    if (request.receiver.toString() !== userId) {
      return res.status(403).json("You can only accept requests sent to you");
    }

    // Update request status
    await FriendRequest.findByIdAndUpdate(req.params.requestId, {
      status: "Accepted"
    });

    // Add each user to the other's friends list
    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: request.receiver }
    });

    await User.findByIdAndUpdate(request.receiver, {
      $addToSet: { friends: request.sender }
    });

    // Create notification for friend accepted
    try {
      await createFriendAcceptedNotification(request.receiver, request.sender);
    } catch (notificationError) {
      console.error("Error creating friend accepted notification:", notificationError);
    }

    res.status(200).json("Friend request accepted");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Reject friend request
router.put("/friend-request/:requestId/reject", async (req, res) => {
  try {
    const { userId } = req.body;
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json("Friend request not found");
    }

    if (request.receiver.toString() !== userId) {
      return res.status(403).json("You can only reject requests sent to you");
    }

    // Update request status
    await FriendRequest.findByIdAndUpdate(req.params.requestId, {
      status: "Rejected"
    });

    res.status(200).json("Friend request rejected");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Cancel friend request
router.delete("/friend-request/:requestId", async (req, res) => {
  try {
    const { userId } = req.body;
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json("Friend request not found");
    }

    if (request.sender.toString() !== userId) {
      return res.status(403).json("You can only cancel requests you sent");
    }

    await FriendRequest.findByIdAndDelete(req.params.requestId);

    res.status(200).json("Friend request cancelled");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Remove friend
router.delete("/friends/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    // Remove friend from user's friends list
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId }
    });

    // Remove user from friend's friends list
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId }
    });

    // Delete any existing friend requests between them
    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId }
      ]
    });

    res.status(200).json("Friend removed successfully");
  } catch (err) {
    res.status(500).json(err);
  }
});

// Check friendship status
router.get("/friendship-status/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    // Check if they are friends
    const user = await User.findById(userId);
    const isFriend = user.friends.includes(otherUserId);

    if (isFriend) {
      return res.status(200).json({ status: "friends" });
    }

    // Check for pending requests
    const pendingRequest = await FriendRequest.findOne({
      $or: [
        { sender: userId, receiver: otherUserId, status: "Pending" },
        { sender: otherUserId, receiver: userId, status: "Pending" }
      ]
    });

    if (pendingRequest) {
      if (pendingRequest.sender.toString() === userId) {
        return res.status(200).json({ status: "request_sent" });
      } else {
        return res.status(200).json({ status: "request_received" });
      }
    }

    res.status(200).json({ status: "none" });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
