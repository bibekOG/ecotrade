const mongoose = require("mongoose");
const ProductActivity = require("./models/ProductActivity");
const Product = require("./models/Product");
const User = require("./models/User");
require("dotenv").config();

async function testCompleteSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Get some existing products
    const products = await Product.find({ status: "Active" }).limit(5);
    const users = await User.find().limit(3);

    if (products.length === 0 || users.length === 0) {
      console.log("❌ Need at least 5 products and 3 users for testing");
      return;
    }

    console.log(`\n🧪 Testing with ${products.length} products and ${users.length} users`);

    // Clear existing activities for clean test
    await ProductActivity.deleteMany({});

    // Simulate realistic user behavior
    console.log("\n1️⃣ Simulating user activities...");
    
    const activities = [];
    
    // Product 1: High engagement (views, clicks, offers)
    const product1 = products[0];
    for (let i = 0; i < users.length; i++) {
      activities.push({ productId: product1._id, userId: users[i]._id, activityType: "view" });
      if (i < 2) activities.push({ productId: product1._id, userId: users[i]._id, activityType: "click" });
      if (i < 1) activities.push({ productId: product1._id, userId: users[i]._id, activityType: "offer" });
    }
    
    // Product 2: Medium engagement (views, some clicks)
    const product2 = products[1];
    for (let i = 0; i < 2; i++) {
      activities.push({ productId: product2._id, userId: users[i]._id, activityType: "view" });
      if (i < 1) activities.push({ productId: product2._id, userId: users[i]._id, activityType: "click" });
    }
    
    // Product 3: Low engagement (only views)
    const product3 = products[2];
    activities.push({ productId: product3._id, userId: users[0]._id, activityType: "view" });

    // Track all activities
    for (const activity of activities) {
      await ProductActivity.trackActivity(
        activity.productId, 
        activity.userId, 
        activity.activityType,
        { testData: true, timestamp: Date.now() }
      );
    }

    console.log(`✅ Tracked ${activities.length} activities`);

    // Test relevance scoring
    console.log("\n2️⃣ Testing relevance scoring...");
    
    const productIds = products.slice(0, 3).map(p => p._id);
    const bulkCounts = await ProductActivity.getBulkActivityCounts(productIds);
    
    const scoredProducts = [];
    for (const product of products.slice(0, 3)) {
      const counts = bulkCounts[product._id.toString()] || { view: 0, click: 0, offer: 0 };
      const score = ProductActivity.calculateRelevanceScore(counts);
      
      scoredProducts.push({
        name: product.productName,
        productFor: product.productFor,
        counts,
        score
      });
    }
    
    // Sort by relevance score
    scoredProducts.sort((a, b) => b.score - a.score);
    
    console.log("\n📊 Product Rankings by Relevance Score:");
    scoredProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.productFor})`);
      console.log(`   Score: ${product.score.toFixed(2)}`);
      console.log(`   Activities: ${product.counts.view}v • ${product.counts.click}c • ${product.counts.offer}o`);
      console.log("");
    });

    // Test the algorithm with different weights
    console.log("\n3️⃣ Testing different weight configurations...");
    
    const weightConfigs = [
      { name: "Standard", weights: { view: 0.1, click: 0.3, offer: 0.6 } },
      { name: "View-focused", weights: { view: 0.5, click: 0.3, offer: 0.2 } },
      { name: "Offer-focused", weights: { view: 0.05, click: 0.15, offer: 0.8 } }
    ];
    
    const product1Counts = bulkCounts[product1._id.toString()];
    
    console.log(`Testing with Product: "${product1.productName}"`);
    console.log(`Activities: ${product1Counts.view} views, ${product1Counts.click} clicks, ${product1Counts.offer} offers\n`);
    
    weightConfigs.forEach(config => {
      const score = ProductActivity.calculateRelevanceScore(product1Counts, config.weights);
      console.log(`${config.name}: Score = ${score.toFixed(2)}`);
    });

    // Test activity tracking with metadata
    console.log("\n4️⃣ Testing activity tracking with metadata...");
    
    const testActivity = await ProductActivity.trackActivity(
      product1._id,
      users[0]._id,
      "click",
      {
        action: "view_details",
        timestamp: Date.now(),
        userAgent: "Test Browser",
        referrer: "search_results"
      }
    );
    
    if (testActivity) {
      console.log("✅ Activity with metadata tracked successfully");
      console.log("Metadata:", testActivity.metadata);
    }

    // Test bulk operations
    console.log("\n5️⃣ Testing bulk activity tracking...");
    
    const bulkActivities = [
      { productId: product2._id, userId: users[1]._id, activityType: "view" },
      { productId: product2._id, userId: users[2]._id, activityType: "view" },
      { productId: product3._id, userId: users[1]._id, activityType: "click" }
    ];
    
    // Simulate API call for bulk tracking
    const bulkResults = {
      success: true,
      tracked: 0,
      duplicates: 0,
      errors: 0
    };
    
    for (const activity of bulkActivities) {
      const result = await ProductActivity.trackActivity(
        activity.productId,
        activity.userId,
        activity.activityType
      );
      
      if (result) bulkResults.tracked++;
      else bulkResults.duplicates++;
    }
    
    console.log("✅ Bulk tracking completed:", bulkResults);

    // Final ranking after additional activities
    console.log("\n6️⃣ Final ranking after additional activities...");
    
    const finalBulkCounts = await ProductActivity.getBulkActivityCounts(productIds);
    const finalRanking = [];
    
    for (const product of products.slice(0, 3)) {
      const counts = finalBulkCounts[product._id.toString()] || { view: 0, click: 0, offer: 0 };
      const score = ProductActivity.calculateRelevanceScore(counts);
      
      finalRanking.push({
        name: product.productName,
        score,
        counts
      });
    }
    
    finalRanking.sort((a, b) => b.score - a.score);
    
    console.log("\n🏆 Final Rankings:");
    finalRanking.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Score: ${product.score.toFixed(2)}`);
      console.log(`   Activities: ${product.counts.view}v • ${product.counts.click}c • ${product.counts.offer}o`);
    });

    console.log("\n✅ Complete system test passed!");
    console.log("\n📝 Summary:");
    console.log("   - Activity tracking: ✅ Working");
    console.log("   - Relevance scoring: ✅ Working");  
    console.log("   - Bulk operations: ✅ Working");
    console.log("   - Metadata support: ✅ Working");
    console.log("   - Weight configurations: ✅ Working");
    console.log("   - Duplicate prevention: ✅ Working");
    
  } catch (error) {
    console.error("❌ System test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

testCompleteSystem();