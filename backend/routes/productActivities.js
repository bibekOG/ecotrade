const router = require("express").Router();
const ProductActivity = require("../models/ProductActivity");
const Product = require("../models/Product");

// Track user activity
router.post("/track", async (req, res) => {
  try {
    const { productId, userId, activityType, metadata = {} } = req.body;

    // Validate required fields
    if (!productId || !userId || !activityType) {
      return res.status(400).json({ error: "Missing required fields: productId, userId, activityType" });
    }

    // Validate activity type
    if (!["view", "click", "offer"].includes(activityType)) {
      return res.status(400).json({ error: "Invalid activity type. Must be 'view', 'click', or 'offer'" });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Track the activity
    const activity = await ProductActivity.trackActivity(productId, userId, activityType, metadata);
    
    res.status(200).json({ 
      success: true, 
      activity: activity,
      message: activity ? "Activity tracked" : "Activity already recorded recently"
    });
  } catch (error) {
    console.error("Error tracking activity:", error);
    res.status(500).json({ error: "Failed to track activity" });
  }
});

// Get activity counts for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    
    const activityCounts = await ProductActivity.getProductActivityCounts(productId);
    const relevanceScore = ProductActivity.calculateRelevanceScore(activityCounts);
    
    res.status(200).json({
      productId,
      activityCounts,
      relevanceScore
    });
  } catch (error) {
    console.error("Error getting product activities:", error);
    res.status(500).json({ error: "Failed to get product activities" });
  }
});

// Get user's activity history
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1, activityType } = req.query;
    
    const query = { userId };
    if (activityType && ["view", "click", "offer"].includes(activityType)) {
      query.activityType = activityType;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const activities = await ProductActivity.find(query)
      .populate("productId", "productName productImages productFor productPrice")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
      
    const total = await ProductActivity.countDocuments(query);
    
    res.status(200).json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error getting user activities:", error);
    res.status(500).json({ error: "Failed to get user activities" });
  }
});

// Get comprehensive activity dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const { timeframe = "7d" } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case "1d":
        dateFilter = { $gte: new Date(now - 24 * 60 * 60 * 1000) };
        break;
      case "7d":
        dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        break;
      case "30d":
        dateFilter = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
        break;
      default:
        dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    }
    
    // Activity stats
    const activityStats = await ProductActivity.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: "$activityType",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Most active products
    const topProducts = await ProductActivity.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: "$productId",
          totalActivity: { $sum: 1 },
          views: { $sum: { $cond: [{ $eq: ["$activityType", "view"] }, 1, 0] } },
          clicks: { $sum: { $cond: [{ $eq: ["$activityType", "click"] }, 1, 0] } },
          offers: { $sum: { $cond: [{ $eq: ["$activityType", "offer"] }, 1, 0] } }
        }
      },
      { $sort: { totalActivity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" }
    ]);
    
    // Most active users
    const topUsers = await ProductActivity.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: "$userId",
          totalActivity: { $sum: 1 },
          uniqueProducts: { $addToSet: "$productId" }
        }
      },
      { $addFields: { uniqueProductCount: { $size: "$uniqueProducts" } } },
      { $sort: { totalActivity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }
    ]);
    
    // Activity timeline
    const timeline = await ProductActivity.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            activityType: "$activityType"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);
    
    res.status(200).json({
      timeframe,
      activityStats: activityStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, { view: 0, click: 0, offer: 0 }),
      topProducts,
      topUsers,
      timeline
    });
  } catch (error) {
    console.error("Error getting activity dashboard:", error);
    res.status(500).json({ error: "Failed to get activity dashboard" });
  }
});

// Get activity statistics
router.get("/stats", async (req, res) => {
  try {
    const { timeframe = "7d" } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    switch (timeframe) {
      case "1d":
        dateFilter = { $gte: new Date(now - 24 * 60 * 60 * 1000) };
        break;
      case "7d":
        dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        break;
      case "30d":
        dateFilter = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
        break;
      default:
        dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    }
    
    const pipeline = [
      {
        $match: {
          createdAt: dateFilter
        }
      },
      {
        $group: {
          _id: "$activityType",
          count: { $sum: 1 }
        }
      }
    ];
    
    const results = await ProductActivity.aggregate(pipeline);
    
    const stats = {
      view: 0,
      click: 0,
      offer: 0,
      total: 0
    };
    
    results.forEach(result => {
      stats[result._id] = result.count;
      stats.total += result.count;
    });
    
    res.status(200).json({ stats, timeframe });
  } catch (error) {
    console.error("Error getting activity stats:", error);
    res.status(500).json({ error: "Failed to get activity stats" });
  }
});

// Bulk track activities (for batch operations)
router.post("/track-bulk", async (req, res) => {
  try {
    const { activities } = req.body;
    
    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: "Activities must be a non-empty array" });
    }
    
    const results = [];
    const errors = [];
    
    for (const activityData of activities) {
      try {
        const { productId, userId, activityType, metadata = {} } = activityData;
        
        if (!productId || !userId || !activityType) {
          errors.push({ activityData, error: "Missing required fields" });
          continue;
        }
        
        if (!["view", "click", "offer"].includes(activityType)) {
          errors.push({ activityData, error: "Invalid activity type" });
          continue;
        }
        
        const activity = await ProductActivity.trackActivity(productId, userId, activityType, metadata);
        results.push(activity);
      } catch (error) {
        errors.push({ activityData, error: error.message });
      }
    }
    
    res.status(200).json({
      success: true,
      tracked: results.filter(r => r !== null).length,
      duplicates: results.filter(r => r === null).length,
      errors: errors.length,
      errorDetails: errors
    });
  } catch (error) {
    console.error("Error bulk tracking activities:", error);
    res.status(500).json({ error: "Failed to bulk track activities" });
  }
});

module.exports = router;