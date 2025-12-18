const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "like",           // Post liked
        "comment",        // Post commented
        "message",        // New message received
        "new_post",       // Friend created a new post
        "offer",          // New offer on product
        "offer_accepted", // Offer accepted
        "offer_rejected", // Offer rejected
        "friend_request", // Friend request sent
        "friend_accepted", // Friend request accepted
        "product_liked",  // Product liked
        "product_approved", // Product approved (admin)
        "product_rejected", // Product rejected (admin)
        "product_message", // Message about a product
        "mention",        // User mentioned in post/comment
      ],
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    message: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    icon: {
      type: String,
      default: "bell",
    },
    redirectLink: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for efficient queries
NotificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, type: 1 });
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);

