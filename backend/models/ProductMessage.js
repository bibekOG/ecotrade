const mongoose = require("mongoose");

const ProductMessageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: false,
      max: 1000,
    },
    imageUrl: {
      type: String,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "offer", "question", "negotiation"],
      default: "text",
    },
    // For offer-related messages
    offerAmount: {
      type: Number,
    },
    exchangeProduct: {
      type: String,
    },
    // Message status
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    // For product owner responses
    isResponse: {
      type: Boolean,
      default: false,
    },
    // Reference to parent message if this is a response
    parentMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductMessage",
    },
  },
  { timestamps: true }
);

// Index for efficient querying
ProductMessageSchema.index({ productId: 1, createdAt: -1 });
ProductMessageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model("ProductMessage", ProductMessageSchema);
