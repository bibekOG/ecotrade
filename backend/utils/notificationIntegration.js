/**
 * Notification Integration Examples
 * Shows how to integrate notifications into existing modules
 */

const NotificationService = require('../services/notificationService');
const { emitNewNotification } = require('../socket/notificationSocket');

/**
 * =====================================================
 * MESSAGE MODULE INTEGRATION
 * =====================================================
 */

/**
 * Example: Call this when a new message is sent
 * Place in: controllers/messageController.js -> sendMessage function
 */
async function sendMessageWithNotification(senderId, receiverId, conversationId, messageText) {
  try {
    // 1. Save your message to database (your existing code)
    // const message = await Message.create({...});
    
    // 2. Get sender info
    const sender = await User.findById(senderId).select('username fullName');
    
    // 3. Create notification
    const notification = await NotificationService.notifyNewMessage(
      senderId,
      receiverId,
      conversationId,
      messageText.substring(0, 50), // Preview
      sender.fullName || sender.username
    );
    
    // 4. Emit real-time notification
    if (notification) {
      emitNewNotification(receiverId, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending message notification:', error);
  }
}

/**
 * =====================================================
 * POST MODULE INTEGRATION
 * =====================================================
 */

/**
 * Example: Call this when someone likes a post
 * Place in: controllers/postController.js -> likePost function
 */
async function likePostWithNotification(userId, postId) {
  try {
    // 1. Like the post (your existing code)
    const post = await Post.findById(postId).populate('userId');
    // await post.updateOne({ $push: { likes: userId } });
    
    // 2. Don't notify if user likes their own post
    if (post.userId._id.toString() === userId.toString()) {
      return null;
    }
    
    // 3. Get liker info
    const liker = await User.findById(userId).select('username fullName');
    
    // 4. Create notification
    const notification = await NotificationService.notifyPostLike(
      userId,
      post.userId._id,
      postId,
      post.desc ? post.desc.substring(0, 50) : 'your post',
      liker.fullName || liker.username
    );
    
    // 5. Emit real-time notification
    if (notification) {
      emitNewNotification(post.userId._id, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending like notification:', error);
  }
}

/**
 * Example: Call this when someone comments on a post
 * Place in: controllers/commentController.js -> addComment function
 */
async function commentPostWithNotification(userId, postId, commentText) {
  try {
    // 1. Create comment (your existing code)
    const comment = await Comment.create({ userId, postId, text: commentText });
    
    // 2. Get post owner
    const post = await Post.findById(postId).populate('userId');
    
    // 3. Don't notify if user comments on their own post
    if (post.userId._id.toString() === userId.toString()) {
      return null;
    }
    
    // 4. Get commenter info
    const commenter = await User.findById(userId).select('username fullName');
    
    // 5. Create notification
    const notification = await NotificationService.notifyPostComment(
      userId,
      post.userId._id,
      postId,
      comment._id,
      commentText.substring(0, 50),
      commenter.fullName || commenter.username
    );
    
    // 6. Emit real-time notification
    if (notification) {
      emitNewNotification(post.userId._id, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending comment notification:', error);
  }
}

/**
 * =====================================================
 * FRIEND SYSTEM INTEGRATION
 * =====================================================
 */

/**
 * Example: Call this when someone sends a friend request
 * Place in: controllers/friendController.js -> sendFriendRequest function
 */
async function sendFriendRequestWithNotification(senderId, receiverId) {
  try {
    // 1. Create friend request (your existing code)
    // const friendRequest = await FriendRequest.create({...});
    
    // 2. Get sender info
    const sender = await User.findById(senderId).select('username fullName');
    
    // 3. Create notification
    const notification = await NotificationService.notifyFriendRequest(
      senderId,
      receiverId,
      sender.fullName || sender.username
    );
    
    // 4. Emit real-time notification
    if (notification) {
      emitNewNotification(receiverId, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending friend request notification:', error);
  }
}

/**
 * Example: Call this when someone accepts a friend request
 * Place in: controllers/friendController.js -> acceptFriendRequest function
 */
async function acceptFriendRequestWithNotification(accepterId, requesterId) {
  try {
    // 1. Accept friend request (your existing code)
    // await FriendRequest.findOneAndUpdate({...});
    
    // 2. Get accepter info
    const accepter = await User.findById(accepterId).select('username fullName');
    
    // 3. Create notification
    const notification = await NotificationService.notifyFriendAccepted(
      accepterId,
      requesterId,
      accepter.fullName || accepter.username
    );
    
    // 4. Emit real-time notification
    if (notification) {
      emitNewNotification(requesterId, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending friend accepted notification:', error);
  }
}

/**
 * =====================================================
 * MARKETPLACE MODULE INTEGRATION
 * =====================================================
 */

/**
 * Example: Call this when someone makes an offer on a product
 * Place in: controllers/productController.js -> makeOffer function
 */
async function makeOfferWithNotification(buyerId, sellerId, productId, offerAmount) {
  try {
    // 1. Create offer (your existing code)
    // const offer = await Offer.create({...});
    
    // 2. Get product and buyer info
    const [product, buyer] = await Promise.all([
      Product.findById(productId),
      User.findById(buyerId).select('username fullName')
    ]);
    
    // 3. Create notification
    const notification = await NotificationService.notifyNewOffer(
      buyerId,
      sellerId,
      productId,
      offerAmount,
      product.productName,
      buyer.fullName || buyer.username
    );
    
    // 4. Emit real-time notification
    if (notification) {
      emitNewNotification(sellerId, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending offer notification:', error);
  }
}

/**
 * Example: Call this when an offer is accepted
 * Place in: controllers/productController.js -> acceptOffer function
 */
async function acceptOfferWithNotification(sellerId, buyerId, productId) {
  try {
    // 1. Accept offer (your existing code)
    // await Offer.findOneAndUpdate({...});
    
    // 2. Get product info
    const product = await Product.findById(productId);
    
    // 3. Create notification
    const notification = await NotificationService.notifyOfferAccepted(
      sellerId,
      buyerId,
      productId,
      product.productName
    );
    
    // 4. Emit real-time notification
    if (notification) {
      emitNewNotification(buyerId, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending offer accepted notification:', error);
  }
}

/**
 * Example: Call this when an offer is rejected
 * Place in: controllers/productController.js -> rejectOffer function
 */
async function rejectOfferWithNotification(sellerId, buyerId, productId) {
  try {
    // 1. Reject offer (your existing code)
    // await Offer.findOneAndUpdate({...});
    
    // 2. Get product info
    const product = await Product.findById(productId);
    
    // 3. Create notification
    const notification = await NotificationService.notifyOfferRejected(
      sellerId,
      buyerId,
      productId,
      product.productName
    );
    
    // 4. Emit real-time notification
    if (notification) {
      emitNewNotification(buyerId, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending offer rejected notification:', error);
  }
}

/**
 * Example: Call this when someone likes a product
 * Place in: controllers/productController.js -> likeProduct function
 */
async function likeProductWithNotification(userId, productId) {
  try {
    // 1. Like product (your existing code)
    const product = await Product.findById(productId).populate('userId');
    // await product.updateOne({ $push: { likes: userId } });
    
    // 2. Don't notify if user likes their own product
    if (product.userId._id.toString() === userId.toString()) {
      return null;
    }
    
    // 3. Get liker info
    const liker = await User.findById(userId).select('username fullName');
    
    // 4. Create notification
    const notification = await NotificationService.notifyProductLike(
      userId,
      product.userId._id,
      productId,
      product.productName,
      liker.fullName || liker.username
    );
    
    // 5. Emit real-time notification
    if (notification) {
      emitNewNotification(product.userId._id, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending product like notification:', error);
  }
}

/**
 * Example: Call this when a product is approved by admin
 * Place in: controllers/adminController.js -> approveProduct function
 */
async function approveProductWithNotification(adminId, productId) {
  try {
    // 1. Approve product (your existing code)
    const product = await Product.findByIdAndUpdate(
      productId,
      { status: 'approved' },
      { new: true }
    ).populate('userId');
    
    // 2. Create notification
    const notification = await NotificationService.notifyProductApproved(
      adminId,
      product.userId._id,
      productId,
      product.productName
    );
    
    // 3. Emit real-time notification
    if (notification) {
      emitNewNotification(product.userId._id, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending product approved notification:', error);
  }
}

/**
 * Example: Call this when a product is rejected by admin
 * Place in: controllers/adminController.js -> rejectProduct function
 */
async function rejectProductWithNotification(adminId, productId, reason) {
  try {
    // 1. Reject product (your existing code)
    const product = await Product.findByIdAndUpdate(
      productId,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    ).populate('userId');
    
    // 2. Create notification
    const notification = await NotificationService.notifyProductRejected(
      adminId,
      product.userId._id,
      productId,
      product.productName,
      reason
    );
    
    // 3. Emit real-time notification
    if (notification) {
      emitNewNotification(product.userId._id, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending product rejected notification:', error);
  }
}

/**
 * Example: Call this when someone sends a message about a product
 * Place in: controllers/productMessageController.js -> sendProductMessage function
 */
async function sendProductMessageWithNotification(senderId, receiverId, conversationId, productId) {
  try {
    // 1. Send message (your existing code)
    // const message = await ProductMessage.create({...});
    
    // 2. Get product and sender info
    const [product, sender] = await Promise.all([
      Product.findById(productId),
      User.findById(senderId).select('username fullName')
    ]);
    
    // 3. Create notification
    const notification = await NotificationService.notifyProductMessage(
      senderId,
      receiverId,
      conversationId,
      productId,
      product.productName,
      sender.fullName || sender.username
    );
    
    // 4. Emit real-time notification
    if (notification) {
      emitNewNotification(receiverId, notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending product message notification:', error);
  }
}

module.exports = {
  // Messages
  sendMessageWithNotification,
  
  // Posts
  likePostWithNotification,
  commentPostWithNotification,
  
  // Friends
  sendFriendRequestWithNotification,
  acceptFriendRequestWithNotification,
  
  // Marketplace
  makeOfferWithNotification,
  acceptOfferWithNotification,
  rejectOfferWithNotification,
  likeProductWithNotification,
  approveProductWithNotification,
  rejectProductWithNotification,
  sendProductMessageWithNotification
};
