/**
 * Test Notification System
 * Quick script to test all notification types
 */

const mongoose = require('mongoose');
const NotificationService = require('./services/notificationService');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/readersroom', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', async () => {
  console.log('✅ Connected to MongoDB');
  await testNotifications();
  process.exit(0);
});

async function testNotifications() {
  try {
    // Replace these with actual user IDs from your database
    const SENDER_ID = 'YOUR_SENDER_USER_ID';
    const RECIPIENT_ID = 'YOUR_RECIPIENT_USER_ID';
    const POST_ID = 'SOME_POST_ID';
    const PRODUCT_ID = 'SOME_PRODUCT_ID';
    const CONVERSATION_ID = 'SOME_CONVERSATION_ID';

    console.log('\n🧪 Testing Notification System...\n');

    // Test 1: Message Notification
    console.log('1️⃣  Testing Message Notification...');
    const messageNotif = await NotificationService.notifyNewMessage(
      SENDER_ID,
      RECIPIENT_ID,
      CONVERSATION_ID,
      'Hey! This is a test message.',
      'Test User'
    );
    console.log('✅ Message notification created:', messageNotif._id);

    // Test 2: Post Like Notification
    console.log('\n2️⃣  Testing Post Like Notification...');
    const likeNotif = await NotificationService.notifyPostLike(
      SENDER_ID,
      RECIPIENT_ID,
      POST_ID,
      'This is a test post content',
      'Test User'
    );
    console.log('✅ Post like notification created:', likeNotif._id);

    // Test 3: Comment Notification
    console.log('\n3️⃣  Testing Comment Notification...');
    const commentNotif = await NotificationService.notifyPostComment(
      SENDER_ID,
      RECIPIENT_ID,
      POST_ID,
      'test_comment_id',
      'Great post!',
      'Test User'
    );
    console.log('✅ Comment notification created:', commentNotif._id);

    // Test 4: Friend Request Notification
    console.log('\n4️⃣  Testing Friend Request Notification...');
    const friendReqNotif = await NotificationService.notifyFriendRequest(
      SENDER_ID,
      RECIPIENT_ID,
      'Test User'
    );
    console.log('✅ Friend request notification created:', friendReqNotif._id);

    // Test 5: Friend Accepted Notification
    console.log('\n5️⃣  Testing Friend Accepted Notification...');
    const friendAcceptNotif = await NotificationService.notifyFriendAccepted(
      RECIPIENT_ID,
      SENDER_ID,
      'Test User'
    );
    console.log('✅ Friend accepted notification created:', friendAcceptNotif._id);

    // Test 6: New Offer Notification
    console.log('\n6️⃣  Testing New Offer Notification...');
    const offerNotif = await NotificationService.notifyNewOffer(
      SENDER_ID,
      RECIPIENT_ID,
      PRODUCT_ID,
      99.99,
      'Test Product',
      'Test User'
    );
    console.log('✅ New offer notification created:', offerNotif._id);

    // Test 7: Offer Accepted Notification
    console.log('\n7️⃣  Testing Offer Accepted Notification...');
    const offerAcceptNotif = await NotificationService.notifyOfferAccepted(
      RECIPIENT_ID,
      SENDER_ID,
      PRODUCT_ID,
      'Test Product'
    );
    console.log('✅ Offer accepted notification created:', offerAcceptNotif._id);

    // Test 8: Product Like Notification
    console.log('\n8️⃣  Testing Product Like Notification...');
    const productLikeNotif = await NotificationService.notifyProductLike(
      SENDER_ID,
      RECIPIENT_ID,
      PRODUCT_ID,
      'Test Product',
      'Test User'
    );
    console.log('✅ Product like notification created:', productLikeNotif._id);

    // Test 9: Product Approved Notification
    console.log('\n9️⃣  Testing Product Approved Notification...');
    const approvedNotif = await NotificationService.notifyProductApproved(
      'ADMIN_ID',
      RECIPIENT_ID,
      PRODUCT_ID,
      'Test Product'
    );
    console.log('✅ Product approved notification created:', approvedNotif._id);

    // Test 10: Product Rejected Notification
    console.log('\n🔟 Testing Product Rejected Notification...');
    const rejectedNotif = await NotificationService.notifyProductRejected(
      'ADMIN_ID',
      RECIPIENT_ID,
      PRODUCT_ID,
      'Test Product',
      'Does not meet community guidelines'
    );
    console.log('✅ Product rejected notification created:', rejectedNotif._id);

    console.log('\n🎉 All notification types tested successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${10} notification types created`);
    console.log(`   - Check recipient's notifications in the app`);
    console.log(`   - Notifications should appear in real-time if socket is connected`);

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  }
}
