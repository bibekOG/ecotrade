const Notification = require("../models/Notification");
const User = require("../models/User");
const Post = require("../models/Post");
const Product = require("../models/Product");
const Comment = require("../models/Comment");
const Conversation = require("../models/Conversation");

// Get Socket.io instance (will be set from index.js)
let io = null;
const setSocketIO = (socketInstance) => {
  io = socketInstance;
};

// Create a notification with Socket.io real-time emit
const createNotification = async (notificationData) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    
    // Emit real-time notification via Socket.io
    if (io) {
      const populatedNotification = await Notification.findById(notification._id)
        .populate("senderId", "username fullName profilePicture")
        .populate("postId", "desc img")
        .populate("productId", "productName productImages")
        .populate("commentId", "text")
        .populate("conversationId");
      
      // Emit to the user's notification room only
      const recipientIdString = notificationData.recipientId.toString();
      const roomName = `user_${recipientIdString}`;
      console.log(`Emitting notification to user room: ${roomName}`);
      
      // Get sockets in the room
      const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
      console.log(`Sockets in room ${roomName}: ${socketsInRoom ? socketsInRoom.size : 0}`);
      
      // Emit to the specific user's notification room
      io.to(roomName).emit("newNotification", populatedNotification);
      
      // Also emit unread count update
      try {
        const unreadCount = await Notification.countDocuments({
          recipientId: notificationData.recipientId,
          read: false
        });
        io.to(roomName).emit("unreadCountUpdate", { unreadCount });
        console.log(`Unread count updated for user ${recipientIdString}: ${unreadCount}`);
      } catch (countError) {
        console.error("Error updating unread count:", countError);
      }
    }
    
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Create like notification for post
const createLikeNotification = async (postId, senderId, recipientId) => {
  try {
    // Don't create notification if user is liking their own post
    if (senderId.toString() === recipientId.toString()) {
      return null;
    }

    const sender = await User.findById(senderId).select("username fullName");
    const post = await Post.findById(postId).select("desc img");
    
    const title = "New Like";
    const message = `${sender.fullName || sender.username} liked your post`;
    const description = post.desc ? (post.desc.length > 100 ? post.desc.substring(0, 100) + "..." : post.desc) : "";

    // Check if notification already exists
    const existingNotification = await Notification.findOne({
      type: "like",
      postId,
      senderId,
      recipientId,
      read: false
    });

    if (existingNotification) {
      return existingNotification;
    }

    return await createNotification({
      recipientId,
      senderId,
      type: "like",
      postId,
      title,
      message,
      description,
      icon: "heart",
      redirectLink: `/post/${postId}`
    });
  } catch (error) {
    console.error("Error creating like notification:", error);
    throw error;
  }
};

// Create comment notification
const createCommentNotification = async (postId, commentId, senderId, recipientId, commentText) => {
  try {
    // Don't create notification if user is commenting on their own post
    if (senderId.toString() === recipientId.toString()) {
      console.log('Skipping notification: user commenting on own post');
      return null;
    }

    const sender = await User.findById(senderId).select("username fullName");
    if (!sender) {
      console.error('Sender not found for comment notification:', senderId);
      return null;
    }

    const post = await Post.findById(postId).select("desc img");
    if (!post) {
      console.error('Post not found for comment notification:', postId);
      return null;
    }

    const truncatedComment = commentText && commentText.length > 50 ? commentText.substring(0, 50) + "..." : (commentText || "");
    
    const title = "New Comment";
    const message = `${sender.fullName || sender.username} commented on your post`;
    const description = truncatedComment ? `"${truncatedComment}"` : "New comment on your post";

    console.log('Creating comment notification with data:', {
      recipientId: recipientId.toString(),
      senderId: senderId.toString(),
      type: "comment",
      postId: postId.toString()
    });

    const notification = await createNotification({
      recipientId,
      senderId,
      type: "comment",
      postId,
      commentId,
      title,
      message,
      description,
      icon: "comment",
      redirectLink: `/post/${postId}`
    });

    console.log('Comment notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error("Error creating comment notification:", error);
    throw error;
  }
};

// Create message notification
const createMessageNotification = async (conversationId, senderId, recipientId, messageText) => {
  try {
    const sender = await User.findById(senderId).select("username fullName profilePicture");
    const conversation = await Conversation.findById(conversationId);
    
    const title = "New Message";
    const truncatedMessage = messageText.length > 100 ? messageText.substring(0, 100) + "..." : messageText;
    const message = `${sender.fullName || sender.username} sent you a message`;
    const description = truncatedMessage;

    return await createNotification({
      recipientId,
      senderId,
      type: "message",
      conversationId,
      title,
      message,
      description,
      icon: "message",
      redirectLink: `/messenger?conversation=${conversationId}`
    });
  } catch (error) {
    console.error("Error creating message notification:", error);
    throw error;
  }
};

// Create offer notification for product
const createOfferNotification = async (productId, senderId, recipientId, offerDetails) => {
  try {
    // Don't create notification if user is making offer on their own product
    if (senderId.toString() === recipientId.toString()) {
      return null;
    }

    const sender = await User.findById(senderId).select("username fullName");
    const product = await Product.findById(productId).select("productName productImages");
    
    const title = "New Offer";
    const message = `${sender.fullName || sender.username} made an offer on your product`;
    const description = offerDetails.offerAmount 
      ? `Offered NRs. ${offerDetails.offerAmount} for ${product.productName}`
      : `Made an offer on ${product.productName}`;

    return await createNotification({
      recipientId,
      senderId,
      type: "offer",
      productId,
      title,
      message,
      description,
      icon: "offer",
      redirectLink: `/marketplace/product/${productId}`,
      metadata: offerDetails
    });
  } catch (error) {
    console.error("Error creating offer notification:", error);
    throw error;
  }
};

// Create offer accepted notification
const createOfferAcceptedNotification = async (productId, senderId, recipientId, offerDetails) => {
  try {
    const sender = await User.findById(senderId).select("username fullName");
    const product = await Product.findById(productId).select("productName");
    
    const title = "Offer Accepted";
    const message = `${sender.fullName || sender.username} accepted your offer`;
    const description = `Your offer for ${product.productName} has been accepted`;

    return await createNotification({
      recipientId,
      senderId,
      type: "offer_accepted",
      productId,
      title,
      message,
      description,
      icon: "check",
      redirectLink: `/marketplace/product/${productId}`,
      metadata: offerDetails
    });
  } catch (error) {
    console.error("Error creating offer accepted notification:", error);
    throw error;
  }
};

// Create offer rejected notification
const createOfferRejectedNotification = async (productId, senderId, recipientId) => {
  try {
    const sender = await User.findById(senderId).select("username fullName");
    const product = await Product.findById(productId).select("productName");
    
    const title = "Offer Rejected";
    const message = `${sender.fullName || sender.username} rejected your offer`;
    const description = `Your offer for ${product.productName} was rejected`;

    return await createNotification({
      recipientId,
      senderId,
      type: "offer_rejected",
      productId,
      title,
      message,
      description,
      icon: "close",
      redirectLink: `/marketplace/product/${productId}`
    });
  } catch (error) {
    console.error("Error creating offer rejected notification:", error);
    throw error;
  }
};

// Create friend request notification
const createFriendRequestNotification = async (senderId, recipientId) => {
  try {
    // Don't create notification if user is sending request to themselves
    if (senderId.toString() === recipientId.toString()) {
      return null;
    }

    const sender = await User.findById(senderId).select("username fullName profilePicture");
    if (!sender) {
      console.error("Sender not found for friend request notification");
      return null;
    }
    
    const title = "Friend Request";
    const message = `${sender.fullName || sender.username} sent you a friend request`;
    const description = "Tap to view and respond";

    console.log(`Creating friend request notification: sender=${senderId}, recipient=${recipientId}`);

    const notification = await createNotification({
      recipientId,
      senderId,
      type: "friend_request",
      title,
      message,
      description,
      icon: "people",
      redirectLink: `/friends`
    });

    console.log(`Friend request notification created: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error("Error creating friend request notification:", error);
    throw error;
  }
};

// Create friend accepted notification
const createFriendAcceptedNotification = async (senderId, recipientId) => {
  try {
    const sender = await User.findById(senderId).select("username fullName profilePicture");
    
    const title = "Friend Request Accepted";
    const message = `${sender.fullName || sender.username} accepted your friend request`;
    const description = "You are now friends";

    return await createNotification({
      recipientId,
      senderId,
      type: "friend_accepted",
      title,
      message,
      description,
      icon: "people",
      redirectLink: `/profile/${sender.username}`
    });
  } catch (error) {
    console.error("Error creating friend accepted notification:", error);
    throw error;
  }
};

// Create product liked notification
const createProductLikedNotification = async (productId, senderId, recipientId) => {
  try {
    if (senderId.toString() === recipientId.toString()) {
      return null;
    }

    const sender = await User.findById(senderId).select("username fullName");
    const product = await Product.findById(productId).select("productName");
    
    const title = "Product Liked";
    const message = `${sender.fullName || sender.username} liked your product`;
    const description = product.productName;

    return await createNotification({
      recipientId,
      senderId,
      type: "product_liked",
      productId,
      title,
      message,
      description,
      icon: "heart",
      redirectLink: `/marketplace/product/${productId}`
    });
  } catch (error) {
    console.error("Error creating product liked notification:", error);
    throw error;
  }
};

// Create product message notification
const createProductMessageNotification = async (productId, senderId, recipientId, messageText) => {
  try {
    const sender = await User.findById(senderId).select("username fullName");
    const product = await Product.findById(productId).select("productName");
    
    const title = "Product Message";
    const truncatedMessage = messageText.length > 100 ? messageText.substring(0, 100) + "..." : messageText;
    const message = `${sender.fullName || sender.username} messaged you about ${product.productName}`;
    const description = truncatedMessage;

    return await createNotification({
      recipientId,
      senderId,
      type: "product_message",
      productId,
      title,
      message,
      description,
      icon: "message",
      redirectLink: `/marketplace/product/${productId}`
    });
  } catch (error) {
    console.error("Error creating product message notification:", error);
    throw error;
  }
};

// Create new post notification for friends
const createNewPostNotification = async (postId, senderId, friendIds) => {
  try {
    if (!friendIds || friendIds.length === 0) {
      return [];
    }

    const sender = await User.findById(senderId).select("username fullName profilePicture");
    const post = await Post.findById(postId).select("desc img");
    
    const title = "New Post";
    const message = `${sender.fullName || sender.username} created a new post`;
    const description = post.desc ? (post.desc.length > 100 ? post.desc.substring(0, 100) + "..." : post.desc) : "Check out their new post";

    // Create notifications for all friends
    const notifications = [];
    for (const friendId of friendIds) {
      // Don't create notification if user is posting to themselves
      if (senderId.toString() === friendId.toString()) {
        continue;
      }

      const notification = await createNotification({
        recipientId: friendId,
        senderId,
        type: "new_post",
        postId,
        title,
        message,
        description,
        icon: "post",
        redirectLink: `/post/${postId}`
      });
      
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error("Error creating new post notifications:", error);
    throw error;
  }
};

// Remove like notification when unlike
const removeLikeNotification = async (postId, senderId, recipientId) => {
  try {
    await Notification.findOneAndDelete({
      type: "like",
      postId,
      senderId,
      recipientId
    });
  } catch (error) {
    console.error("Error removing like notification:", error);
    throw error;
  }
};

module.exports = {
  setSocketIO,
  createNotification,
  createLikeNotification,
  createCommentNotification,
  createMessageNotification,
  createNewPostNotification,
  createOfferNotification,
  createOfferAcceptedNotification,
  createOfferRejectedNotification,
  createFriendRequestNotification,
  createFriendAcceptedNotification,
  createProductLikedNotification,
  createProductMessageNotification,
  removeLikeNotification
};
