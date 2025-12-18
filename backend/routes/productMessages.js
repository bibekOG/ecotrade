const router = require("express").Router();
const ProductMessage = require("../models/ProductMessage");
const Product = require("../models/Product");
const User = require("../models/User");
const { createOfferNotification, createProductMessageNotification } = require("../utils/notificationService");

// Send a message about a product
router.post("/", async (req, res) => {
  try {
    const { productId, receiverId, message, messageType, offerAmount, exchangeProduct, imageUrl } = req.body;
    
    // Verify the product exists and is active
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json("Product not found");
    }
    
    if (product.status !== "Active") {
      return res.status(400).json("Product is not available for messaging");
    }
    
    // Verify participants: one side must be the product owner
    const isSenderOwner = product.userId.toString() === req.body.senderId;
    const isReceiverOwner = product.userId.toString() === receiverId;
    if (!isSenderOwner && !isReceiverOwner) {
      return res.status(403).json("Invalid participants for this product conversation");
    }
    
    // Ensure messageType is set correctly
    const finalMessageType = imageUrl ? 'image' : (messageType || 'text');
    const finalMessage = imageUrl ? (message || null) : message;
    
    // Create the message
    const newMessage = new ProductMessage({
      productId,
      senderId: req.body.senderId,
      receiverId,
      message: finalMessage,
      messageType: finalMessageType,
      offerAmount,
      exchangeProduct,
      imageUrl,
    });
    
    const savedMessage = await newMessage.save();
    
    // If this is an offer sent by a buyer, mirror it into Product.offers so
    // marketplace Offers/Transactions UIs can display it
    try {
      if (messageType === "offer") {
        // Determine the offer payload
        const offerPayload = {
          userId: req.body.senderId,
          offerAmount: typeof offerAmount === 'number' ? offerAmount : undefined,
          exchangeProduct: exchangeProduct || undefined,
          // Use product.validTill as the default claim/offer validity window
          claimTill: product.validTill || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          message: message || "",
          status: "Pending",
          createdAt: new Date(),
        };
        
        await Product.updateOne(
          { _id: productId },
          { $push: { offers: offerPayload } }
        );
      }
    } catch (err) {
      console.error("Error mirroring offer to product.offers:", err);
      // Do not fail the message API if mirroring fails; continue
    }
    
    // Populate sender and receiver details
    const populatedMessage = await ProductMessage.findById(savedMessage._id)
      .populate("senderId", "username profilePicture")
      .populate("receiverId", "username profilePicture");
    
    // Create notification for offer or product message
    if (finalMessageType === "offer") {
      try {
        const offerDetails = {
          offerAmount,
          exchangeProduct,
          message: finalMessage
        };
        await createOfferNotification(productId, req.body.senderId, receiverId, offerDetails);
      } catch (notificationError) {
        console.error("Error creating offer notification:", notificationError);
      }
    } else if (finalMessageType === "text" || finalMessageType === "image") {
      try {
        const notificationText = imageUrl 
          ? "Sent an image" 
          : (finalMessage || "New message");
        await createProductMessageNotification(productId, req.body.senderId, receiverId, notificationText);
      } catch (notificationError) {
        console.error("Error creating product message notification:", notificationError);
      }
    }
    
    res.status(200).json(populatedMessage);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json(err);
  }
});

// Get conversation between two users about a specific product
router.get("/product/:productId/conversation/:userId1/:userId2", async (req, res) => {
  try {
    const { productId, userId1, userId2 } = req.params;
    
    const messages = await ProductMessage.find({
      productId,
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    })
    .populate("senderId", "username profilePicture")
    .populate("receiverId", "username profilePicture")
    .sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching conversation:", err);
    res.status(500).json(err);
  }
});

// Get all conversations for a user (as sender or receiver)
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all messages where user is sender or receiver
    const messages = await ProductMessage.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
    .populate("productId", "productName productImages status userId")
    .populate("senderId", "username profilePicture")
    .populate("receiverId", "username profilePicture")
    .sort({ createdAt: -1 });
    
    // Group messages by product and other user
    const conversations = {};
    
    messages.forEach(message => {
      // Defensive checks: message fields may be null if related docs were deleted
      const product = message.productId || {};
      const sender = message.senderId || {};
      const receiver = message.receiverId || {};

      const productId = (product._id || product).toString();

      const senderIdStr = sender._id ? sender._id.toString() : (sender.toString ? sender.toString() : null);
      const receiverIdStr = receiver._id ? receiver._id.toString() : (receiver.toString ? receiver.toString() : null);
      const userIdStr = userId.toString();

      // Determine other participant
      const otherUser = (senderIdStr === userIdStr) ? receiver : sender;
      const otherUserIdStr = (senderIdStr === userIdStr) ? receiverIdStr : senderIdStr;

      // Skip malformed messages where we can't determine the other user or product
      if (!otherUserIdStr || !productId) return;

      const conversationKey = `${productId}-${otherUserIdStr}`;

      if (!conversations[conversationKey]) {
        conversations[conversationKey] = {
          productId: message.productId || { _id: productId },
          otherUser: otherUser || { _id: otherUserIdStr, username: 'Unknown' },
          lastMessage: message,
          unreadCount: 0,
          messageCount: 0
        };
      }

      // Count unread messages (defensive check)
      if (receiverIdStr === userIdStr && message.status !== "read") {
        conversations[conversationKey].unreadCount++;
      }

      conversations[conversationKey].messageCount++;

      // Update last message if this one is newer
      if (new Date(message.createdAt) > new Date(conversations[conversationKey].lastMessage.createdAt)) {
        conversations[conversationKey].lastMessage = message;
      }
    });
    
    // Convert to array and sort by last message time
    const conversationsArray = Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );
    
    res.status(200).json(conversationsArray);
  } catch (err) {
    console.error("Error fetching user conversations:", err);
    res.status(500).json(err);
  }
});

// Mark messages as read
router.put("/read/:productId/:senderId/:receiverId", async (req, res) => {
  try {
    const { productId, senderId, receiverId } = req.params;
    
    await ProductMessage.updateMany(
      {
        productId,
        senderId,
        receiverId,
        status: { $ne: "read" }
      },
      {
        $set: { status: "read" }
      }
    );
    
    res.status(200).json("Messages marked as read");
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json(err);
  }
});

// Send a response to a message
router.post("/response", async (req, res) => {
  try {
    const { productId, receiverId, message, parentMessageId, offerAmount, exchangeProduct } = req.body;
    
    // Verify the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json("Product not found");
    }
    
    // Create the response message
    const newResponse = new ProductMessage({
      productId,
      senderId: req.body.senderId,
      receiverId,
      message,
      messageType: "text",
      offerAmount,
      exchangeProduct,
      isResponse: true,
      parentMessageId,
    });
    
    const savedResponse = await newResponse.save();
    
    // Populate sender and receiver details
    const populatedResponse = await ProductMessage.findById(savedResponse._id)
      .populate("senderId", "username profilePicture")
      .populate("receiverId", "username profilePicture");
    
    res.status(200).json(populatedResponse);
  } catch (err) {
    console.error("Error sending response:", err);
    res.status(500).json(err);
  }
});

// Delete a message (only sender can delete)
router.delete("/:messageId", async (req, res) => {
  try {
    const message = await ProductMessage.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json("Message not found");
    }
    
    if (message.senderId.toString() !== req.body.userId) {
      return res.status(403).json("You can only delete your own messages");
    }
    
    await ProductMessage.findByIdAndDelete(req.params.messageId);
    res.status(200).json("Message deleted successfully");
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).json(err);
  }
});

module.exports = router;
