const mongoose = require("mongoose");
const ProductActivity = require("./models/ProductActivity");
const Product = require("./models/Product");
const User = require("./models/User");
require("dotenv").config();

async function seedActivities() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    // Get existing products and users
    const products = await Product.find({ status: "Active" }).limit(20);
    const users = await User.find().limit(10);

    if (products.length === 0) {
      console.log("❌ No active products found. Please add some products first.");
      return;
    }

    if (users.length === 0) {
      console.log("❌ No users found. Please add some users first.");
      return;
    }

    console.log(`Found ${products.length} products and ${users.length} users`);

    // Clear existing activities for clean test
    await ProductActivity.deleteMany({});
    console.log("Cleared existing activities");

    let totalActivities = 0;

    // Generate realistic activity patterns
    for (const product of products) {
      const productId = product._id;
      const numUsers = Math.min(users.length, Math.floor(Math.random() * 8) + 2); // 2-8 users per product
      
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random()).slice(0, numUsers);
      
      for (const user of shuffledUsers) {
        const userId = user._id;
        
        // Skip if it's the product owner
        if (product.userId.toString() === userId.toString()) {
          continue;
        }
        
        // Generate view activity (high probability)
        if (Math.random() < 0.9) { // 90% chance
          await ProductActivity.trackActivity(productId, userId, "view", {
            productName: product.productName,
            timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000) // Last 7 days
          });
          totalActivities++;
        }
        
        // Generate click activity (medium probability)
        if (Math.random() < 0.4) { // 40% chance
          await ProductActivity.trackActivity(productId, userId, "click", {
            productName: product.productName,
            action: "view_details",
            timestamp: Date.now() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000) // Last 5 days
          });
          totalActivities++;
        }
        
        // Generate offer activity (low probability)
        if (Math.random() < 0.1) { // 10% chance
          let metadata = {
            productName: product.productName,
            offerType: product.productFor,
            timestamp: Date.now() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000) // Last 3 days
          };
          
          if (product.productFor === "Sale") {
            metadata.offerAmount = Math.floor(product.productPrice * (0.7 + Math.random() * 0.3)); // 70-100% of asking price
          } else if (product.productFor === "Exchange") {
            metadata.exchangeProduct = "Sample Exchange Item";
          }
          
          await ProductActivity.trackActivity(productId, userId, "offer", metadata);
          totalActivities++;
        }
      }
    }

    console.log(`✅ Created ${totalActivities} sample activities`);

    // Display some statistics
    console.log("\n📊 Activity Statistics:");
    
    const stats = await ProductActivity.aggregate([
      {
        $group: {
          _id: "$activityType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    // Show top products by relevance score
    console.log("\n🏆 Top Products by Relevance Score:");
    
    const productIds = products.map(p => p._id);
    const bulkCounts = await ProductActivity.getBulkActivityCounts(productIds);
    
    const productScores = products.map(product => {
      const counts = bulkCounts[product._id.toString()] || { view: 0, click: 0, offer: 0 };
      const score = ProductActivity.calculateRelevanceScore(counts);
      
      return {
        productName: product.productName,
        productFor: product.productFor,
        score: score,
        activities: counts
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    
    productScores.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.productName} (${product.productFor})`);
      console.log(`     Score: ${product.score.toFixed(2)} | Views: ${product.activities.view} | Clicks: ${product.activities.click} | Offers: ${product.activities.offer}`);
    });

    console.log("\n✅ Activity seeding completed!");
    
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedActivities();