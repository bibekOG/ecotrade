/**
 * Notification Triggers - Integration Functions
 * 
 * This module provides ready-to-use functions to trigger notifications
 * from different modules (messages, posts, friends, marketplace).
 * 
 * Usage: Import these functions in your routes/controllers and call them
 * when relevant actions occur.
 */

const notificationService = require('./notificationService');

/**
 * ========================
 * MESSAGE NOTIFICATIONS
 * ========================
 */

/**
 * Trigger notification when a new message is sent
 * Call this in: routes/messages.js after creating a new message
 * 
 * @example
 * const message = new Message({ senderId, receiverId, text });
 * await message.save();
 * await notificationTriggers.onNewMessage(message._id, senderId, receiverId, text, conversationId);
 */
const onNewMessage = async (messageId, senderId, receiverId, messageText, conversationId) => {
  try {
    await notificationService.createMessageNotification(
      receiverId,
      senderId,
      messageText,
      conversationId
    );
    console.log(`✅ Message notification sent: ${senderId} -> ${receiverId}`);
  } catch (error) {
    console.error('❌ Error triggering message notification:', error);
  }
};

/**
 * ========================
 * POST NOTIFICATIONS
 * ========================
 */

/**
 * Trigger notification when a post is liked
 * Call this in: routes/posts.js when liking a post
 * 
 * @example
 * await Post.findByIdAndUpdate(postId, { $push: { likes: userId } });
 * await notificationTriggers.onPostLiked(postId, userId, post.userId);
 */
const onPostLiked = async (postId, likerId, postOwnerId) => {
  try {
    await notificationService.createLikeNotification(postId, likerId, postOwnerId);
    console.log(`✅ Like notification sent: Post ${postId}`);
  } catch (error) {
    console.error('❌ Error triggering like notification:', error);
  }
};

/**
 * Remove notification when a post is unliked
 * Call this in: routes/posts.js when unliking a post
 * 
 * @example
 * await Post.findByIdAndUpdate(postId, { $pull: { likes: userId } });
 * await notificationTriggers.onPostUnliked(postId, userId, post.userId);
 */
const onPostUnliked = async (postId, unlikerId, postOwnerId) => {
  try {
    await notificationService.removeLikeNotification(postId, unlikerId, postOwnerId);
    console.log(`✅ Like notification removed: Post ${postId}`);
  } catch (error) {
    console.error('❌ Error removing like notification:', error);
  }
};

/**
 * Trigger notification when a post is commented on
 * Call this in: routes/comments.js after creating a comment
 * 
 * @example
 * const comment = new Comment({ userId, postId, text });
 * await comment.save();
 * const post = await Post.findById(postId);
 * await notificationTriggers.onPostCommented(postId, comment._id, userId, post.userId, text);
 */
const onPostCommented = async (postId, commentId, commenterId, postOwnerId, commentText) => {
  try {
    await notificationService.createCommentNotification(
      postId,
      commentId,
      commenterId,
      postOwnerId,
      commentText
    );
    console.log(`✅ Comment notification sent: Post ${postId}`);
  } catch (error) {
    console.error('❌ Error triggering comment notification:', error);
  }
};

/**
 * ========================
 * FRIEND SYSTEM NOTIFICATIONS
 * ========================
 */

/**
 * Trigger notification when a friend request is sent
 * Call this in: routes/friends.js after creating a friend request
 * 
 * @example
 * const friendRequest = new FriendRequest({ senderId: userId, receiverId: friendId });
 * await friendRequest.save();
 * await notificationTriggers.onFriendRequestSent(userId, friendId);
 */
const onFriendRequestSent = async (senderId, receiverId) => {
  try {
    await notificationService.createFriendRequestNotification(senderId, receiverId);
    console.log(`✅ Friend request notification sent: ${senderId} -> ${receiverId}`);
  } catch (error) {
    console.error('❌ Error triggering friend request notification:', error);
  }
};

/**
 * Trigger notification when a friend request is accepted
 * Call this in: routes/friends.js after accepting a friend request
 * 
 * @example
 * await FriendRequest.findByIdAndUpdate(requestId, { status: 'accepted' });
 * await User.findByIdAndUpdate(userId, { $push: { friends: friendId } });
 * await User.findByIdAndUpdate(friendId, { $push: { friends: userId } });
 * await notificationTriggers.onFriendRequestAccepted(userId, friendId);
 */
const onFriendRequestAccepted = async (accepterId, requesterId) => {
  try {
    await notificationService.createFriendAcceptedNotification(accepterId, requesterId);
    console.log(`✅ Friend accepted notification sent: ${accepterId} -> ${requesterId}`);
  } catch (error) {
    console.error('❌ Error triggering friend accepted notification:', error);
  }
};

/**
 * ========================
 * MARKETPLACE NOTIFICATIONS
 * ========================
 */

/**
 * Trigger notification when a new offer is made on a product
 * Call this in: routes/products.js or routes/offers.js after creating an offer
 * 
 * @example
 * const offer = new Offer({ productId, senderId, receiverId, amount });
 * await offer.save();
 * const product = await Product.findById(productId);
 * await notificationTriggers.onNewOffer(productId, senderId, product.userId, amount);
 */
const onNewOffer = async (productId, senderId, productOwnerId, offerAmount) => {
  try {
    await notificationService.createOfferNotification(
      productId,
      senderId,
      productOwnerId,
      offerAmount
    );
    console.log(`✅ Offer notification sent: Product ${productId}`);
  } catch (error) {
    console.error('❌ Error triggering offer notification:', error);
  }
};

/**
 * Trigger notification when an offer is accepted
 * Call this in: routes/offers.js after accepting an offer
 * 
 * @example
 * await Offer.findByIdAndUpdate(offerId, { status: 'accepted' });
 * await notificationTriggers.onOfferAccepted(productId, productOwnerId, offererId);
 */
const onOfferAccepted = async (productId, accepterId, offererId) => {
  try {
    await notificationService.createOfferAcceptedNotification(
      productId,
      accepterId,
      offererId
    );
    console.log(`✅ Offer accepted notification sent: Product ${productId}`);
  } catch (error) {
    console.error('❌ Error triggering offer accepted notification:', error);
  }
};

/**
 * Trigger notification when an offer is rejected
 * Call this in: routes/offers.js after rejecting an offer
 * 
 * @example
 * await Offer.findByIdAndUpdate(offerId, { status: 'rejected' });
 * await notificationTriggers.onOfferRejected(productId, productOwnerId, offererId);
 */
const onOfferRejected = async (productId, rejecterId, offererId) => {
  try {
    await notificationService.createOfferRejectedNotification(
      productId,
      rejecterId,
      offererId
    );
    console.log(`✅ Offer rejected notification sent: Product ${productId}`);
  } catch (error) {
    console.error('❌ Error triggering offer rejected notification:', error);
  }
};

/**
 * Trigger notification when a product is liked
 * Call this in: routes/products.js when liking a product
 * 
 * @example
 * await Product.findByIdAndUpdate(productId, { $push: { likes: userId } });
 * const product = await Product.findById(productId);
 * await notificationTriggers.onProductLiked(productId, userId, product.userId);
 */
const onProductLiked = async (productId, likerId, productOwnerId) => {
  try {
    await notificationService.createProductLikedNotification(
      productId,
      likerId,
      productOwnerId
    );
    console.log(`✅ Product liked notification sent: Product ${productId}`);
  } catch (error) {
    console.error('❌ Error triggering product liked notification:', error);
  }
};

/**
 * Trigger notification when a message is sent about a product
 * Call this in: routes/productMessages.js after creating a product message
 * 
 * @example
 * const message = new ProductMessage({ productId, senderId, receiverId, text });
 * await message.save();
 * await notificationTriggers.onProductMessage(productId, senderId, receiverId, text);
 */
const onProductMessage = async (productId, senderId, receiverId, messageText) => {
  try {
    await notificationService.createProductMessageNotification(
      productId,
      senderId,
      receiverId,
      messageText
    );
    console.log(`✅ Product message notification sent: Product ${productId}`);
  } catch (error) {
    console.error('❌ Error triggering product message notification:', error);
  }
};

/**
 * Trigger notification when a product is approved (admin action)
 * Call this in: routes/admin.js or routes/products.js after approving
 * 
 * @example
 * await Product.findByIdAndUpdate(productId, { status: 'approved' });
 * const product = await Product.findById(productId);
 * await notificationTriggers.onProductApproved(productId, product.userId);
 */
const onProductApproved = async (productId, productOwnerId, adminId = null) => {
  try {
    const notificationData = {
      recipientId: productOwnerId,
      senderId: adminId || productOwnerId, // Use admin ID if provided
      type: "product_approved",
      productId,
      title: "Product Approved",
      message: "Your product has been approved and is now live!",
      description: "Congratulations! Your product listing is now visible to all users.",
      icon: "check-circle",
      redirectLink: `/marketplace/product/${productId}`
    };
    
    await notificationService.createNotification(notificationData);
    console.log(`✅ Product approved notification sent: Product ${productId}`);
  } catch (error) {
    console.error('❌ Error triggering product approved notification:', error);
  }
};

/**
 * Trigger notification when a product is rejected (admin action)
 * Call this in: routes/admin.js or routes/products.js after rejecting
 * 
 * @example
 * await Product.findByIdAndUpdate(productId, { status: 'rejected', rejectionReason: reason });
 * const product = await Product.findById(productId);
 * await notificationTriggers.onProductRejected(productId, product.userId, reason);
 */
const onProductRejected = async (productId, productOwnerId, reason = "", adminId = null) => {
  try {
    const notificationData = {
      recipientId: productOwnerId,
      senderId: adminId || productOwnerId, // Use admin ID if provided
      type: "product_rejected",
      productId,
      title: "Product Rejected",
      message: "Your product listing has been rejected",
      description: reason || "Please review our marketplace guidelines and resubmit.",
      icon: "x-circle",
      redirectLink: `/marketplace/product/${productId}`
    };
    
    await notificationService.createNotification(notificationData);
    console.log(`✅ Product rejected notification sent: Product ${productId}`);
  } catch (error) {
    console.error('❌ Error triggering product rejected notification:', error);
  }
};

/**
 * ========================
 * EXPORT ALL TRIGGERS
 * ========================
 */

module.exports = {
  // Message triggers
  onNewMessage,
  
  // Post triggers
  onPostLiked,
  onPostUnliked,
  onPostCommented,
  
  // Friend system triggers
  onFriendRequestSent,
  onFriendRequestAccepted,
  
  // Marketplace triggers
  onNewOffer,
  onOfferAccepted,
  onOfferRejected,
  onProductLiked,
  onProductMessage,
  onProductApproved,
  onProductRejected
};
