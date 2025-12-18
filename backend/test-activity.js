const mongoose = require("mongoose");
const ProductActivity = require("./models/ProductActivity");
const Product = require("./models/Product");
require("dotenv").config();

async function testActivitySystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Test data
    const sampleProductId = new mongoose.Types.ObjectId();
    const sampleUserId = new mongoose.Types.ObjectId();

    console.log("\n1. Testing activity tracking...");
    
    // Track some activities
    await ProductActivity.trackActivity(sampleProductId, sampleUserId, "view", { test: true });
    await ProductActivity.trackActivity(sampleProductId, sampleUserId, "view", { test: true }); // Should be ignored (duplicate)
    await ProductActivity.trackActivity(sampleProductId, sampleUserId, "click", { action: "details" });
    await ProductActivity.trackActivity(sampleProductId, sampleUserId, "offer", { amount: 100 });

    console.log("✓ Activities tracked successfully");

    console.log("\n2. Testing activity counts...");
    
    const activityCounts = await ProductActivity.getProductActivityCounts(sampleProductId);
    console.log("Activity counts:", activityCounts);

    console.log("\n3. Testing relevance score calculation...");
    
    const relevanceScore = ProductActivity.calculateRelevanceScore(activityCounts);
    console.log("Relevance score:", relevanceScore);

    console.log("\n4. Testing bulk activity counts...");
    
    const bulkCounts = await ProductActivity.getBulkActivityCounts([sampleProductId]);
    console.log("Bulk counts:", bulkCounts);

    console.log("\n5. Example with multiple products...");
    
    const product2Id = new mongoose.Types.ObjectId();
    const user2Id = new mongoose.Types.ObjectId();

    // Create activity for second product
    await ProductActivity.trackActivity(product2Id, user2Id, "view");
    await ProductActivity.trackActivity(product2Id, user2Id, "click");

    const bulkCounts2 = await ProductActivity.getBulkActivityCounts([sampleProductId, product2Id]);
    console.log("Bulk counts for 2 products:", bulkCounts2);

    // Calculate scores for both
    Object.keys(bulkCounts2).forEach(productId => {
      const counts = bulkCounts2[productId];
      const score = ProductActivity.calculateRelevanceScore(counts);
      console.log(`Product ${productId}: Score = ${score}, Activities =`, counts);
    });

    console.log("\n✅ All tests passed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

testActivitySystem();