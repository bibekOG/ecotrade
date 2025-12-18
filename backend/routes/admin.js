const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const Product = require("../models/Product");
const ProductMessage = require("../models/ProductMessage");
const Message = require("../models/Message");
const Comment = require("../models/Comment");
const FriendRequest = require("../models/FriendRequest");
const Ad = require("../models/Ad");
const mongoose = require("mongoose");

// Simple admin validator using adminId param/header
async function validateAdmin(req, res, next) {
  try {
    const adminId = req.query.adminId || req.headers["x-admin-id"] || req.body.adminId;
    if (!adminId) return res.status(401).json("Missing adminId");
    const adminUser = await User.findById(adminId);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json("Admin access required");
    req.adminUser = adminUser;
    next();
  } catch (err) {
    res.status(500).json(err);
  }
}

// GET /api/admin/stats
router.get("/stats", validateAdmin, async (req, res) => {
  try {
    const [users, posts, products, productMessages, messages, comments, friendRequests, ads] = await Promise.all([
      User.countDocuments({}),
      Post.countDocuments({}),
      Product.countDocuments({}),
      ProductMessage.countDocuments({}),
      Message.countDocuments({}),
      Comment.countDocuments({}),
      FriendRequest.countDocuments({}),
      Ad.countDocuments({}),
    ]);

    // Offers and claims counts aggregated across products
    const productsWithCounts = await Product.aggregate([
      {
        $project: {
          offersCount: { $size: { $ifNull: ["$offers", []] } },
          claimsCount: { $size: { $ifNull: ["$claims", []] } },
        }
      },
      {
        $group: {
          _id: null,
          offers: { $sum: "$offersCount" },
          claims: { $sum: "$claimsCount" }
        }
      }
    ]);
    const totals = productsWithCounts[0] || { offers: 0, claims: 0 };

    res.status(200).json({
      users,
      posts,
      products,
      offers: totals.offers,
      claims: totals.claims,
      productMessages,
      messages,
      comments,
      friendRequests,
      ads,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET /api/admin/recent?adminId=...&limit=10
router.get("/recent", validateAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 50);

    const [users, posts, products, productMessages, messages, comments] = await Promise.all([
      User.find({}).sort({ createdAt: -1 }).limit(limit).select("username email createdAt isAdmin"),
      Post.find({}).sort({ createdAt: -1 }).limit(limit),
      Product.find({}).sort({ createdAt: -1 }).limit(limit).populate("userId", "username profilePicture"),
      ProductMessage.find({}).sort({ createdAt: -1 }).limit(limit)
        .populate("senderId", "username profilePicture")
        .populate("receiverId", "username profilePicture")
        .populate("productId", "productName"),
      Message.find({}).sort({ createdAt: -1 }).limit(limit),
      Comment.find({}).sort({ createdAt: -1 }).limit(limit).populate("userId", "username profilePicture"),
    ]);

    // Recent offers/claims via aggregation
    const recentOffers = await Product.aggregate([
      { $unwind: "$offers" },
      { $sort: { "offers.createdAt": -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: "$productName",
          userId: "$offers.userId",
          offerAmount: "$offers.offerAmount",
          exchangeProduct: "$offers.exchangeProduct",
          message: "$offers.message",
          status: "$offers.status",
          createdAt: "$offers.createdAt",
        }
      }
    ]);

    const recentClaims = await Product.aggregate([
      { $unwind: "$claims" },
      { $sort: { "claims.createdAt": -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          productName: "$productName",
          userId: "$claims.userId",
          message: "$claims.message",
          status: "$claims.status",
          createdAt: "$claims.createdAt",
        }
      }
    ]);

    res.status(200).json({
      users,
      posts,
      products,
      offers: recentOffers,
      claims: recentClaims,
      productMessages,
      messages,
      comments,
    });
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET /api/admin/activity?adminId=...&userId=...&productId=...&limit=20
// Filters recent activity by user or product
router.get("/activity", validateAdmin, async (req, res) => {
  try {
    const { userId, productId } = req.query;
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);

    const userFilter = userId ? { _id: userId } : {};
    const productFilter = productId ? { _id: productId } : {};

    const [users, products] = await Promise.all([
      userId ? User.find(userFilter).select("username email isAdmin createdAt") : Promise.resolve([]),
      productId ? Product.find(productFilter).populate("userId", "username").limit(50) : Promise.resolve([]),
    ]);

    const posts = await Post.find(userId ? { userId } : {}).sort({ createdAt: -1 }).limit(limit);

    const productQuery = productId ? { productId } : {};
    const productMsgs = await ProductMessage.find({
      ...(userId ? { $or: [{ senderId: userId }, { receiverId: userId }] } : {}),
      ...productQuery,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("senderId", "username")
      .populate("receiverId", "username")
      .populate("productId", "productName");

    const offers = await Product.aggregate([
      ...(productId ? [{ $match: { _id: Product.db.castObjectId(productId) } }] : []),
      { $unwind: "$offers" },
      ...(userId ? [{ $match: { "offers.userId": mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId } }] : []),
      { $sort: { "offers.createdAt": -1 } },
      { $limit: limit },
      { $project: { productId: "$_id", productName: "$productName", userId: "$offers.userId", message: "$offers.message", offerAmount: "$offers.offerAmount", exchangeProduct: "$offers.exchangeProduct", status: "$offers.status", createdAt: "$offers.createdAt" } }
    ]);

    const claims = await Product.aggregate([
      ...(productId ? [{ $match: { _id: Product.db.castObjectId(productId) } }] : []),
      { $unwind: "$claims" },
      ...(userId ? [{ $match: { "claims.userId": mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId } }] : []),
      { $sort: { "claims.createdAt": -1 } },
      { $limit: limit },
      { $project: { productId: "$_id", productName: "$productName", userId: "$claims.userId", message: "$claims.message", status: "$claims.status", createdAt: "$claims.createdAt" } }
    ]);

    const comments = await Comment.find({ ...(userId ? { userId } : {}), ...(productId ? { productId } : {}) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "username");

    // Include filtered products list for dashboard view
    const filteredProducts = productId
      ? products
      : (userId ? await Product.find({ userId }).sort({ createdAt: -1 }).limit(limit).populate("userId", "username") : []);

    res.status(200).json({ users, products: filteredProducts, posts, productMessages: productMsgs, offers, claims, comments });
  } catch (err) {
    console.error("Admin activity error:", err);
    res.status(500).json(err);
  }
});

// GET /api/admin/users-list?limit=100
router.get("/users-list", validateAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "100", 10), 500);
    const users = await User.find({})
      .sort({ username: 1 })
      .limit(limit)
      .select("username email _id");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET /api/admin/products-list?limit=100
router.get("/products-list", validateAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "100", 10), 500);
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("productName _id userId");
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET /api/admin/users-analytics
router.get("/users-analytics", validateAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select("username email _id status warnings createdAt");
    const userIds = users.map(u => u._id);
    const [postCounts, productCounts, followerCounts] = await Promise.all([
      Post.aggregate([{ $match: { userId: { $in: userIds.map(id => id.toString()) } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
      Product.aggregate([{ $match: { userId: { $in: userIds } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
      User.aggregate([{ $match: { _id: { $in: userIds } } }, { $project: { followersCount: { $size: { $ifNull: ["$followers", []] } } } }])
    ]);

    const postMap = new Map(postCounts.map(p => [p._id, p.count]));
    const productMap = new Map(productCounts.map(p => [p._id.toString(), p.count]));
    // followerCounts preserve order with users; map by index
    const analytics = users.map((u, idx) => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      status: u.status,
      warnings: u.warnings,
      createdAt: u.createdAt,
      totalPosts: postMap.get(u._id.toString()) || 0,
      totalFollowers: followerCounts[idx]?.followersCount || 0,
      totalProducts: productMap.get(u._id.toString()) || 0,
    }));
    res.status(200).json(analytics);
  } catch (err) {
    console.error("users-analytics error:", err);
    res.status(500).json(err);
  }
});

// Moderation actions
router.put("/users/:id/warn", validateAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $inc: { warnings: 1 } }, { new: true });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.put("/users/:id/ban", validateAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { $set: { status: "banned" } }, { new: true });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.delete("/users/:id", validateAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User deleted");
  } catch (err) {
    res.status(500).json(err);
  }
});

// PUT /api/admin/users/:id - Update user status and role
router.put("/users/:id", validateAdmin, async (req, res) => {
  try {
    const { status, isAdmin } = req.body;
    const updateData = {};
    
    if (status !== undefined) updateData.status = status;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select("username fullName email isAdmin status friends createdAt");

    if (!updatedUser) {
      return res.status(404).json("User not found");
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json(err);
  }
});

// GET /api/admin/users-detailed - Get detailed user information
router.get("/users-detailed", validateAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("username fullName email profilePicture isAdmin status friends createdAt");

    // Get post counts for each user
    const userIds = users.map(u => u._id);
    const postCounts = await Post.aggregate([
      { $match: { userId: { $in: userIds.map(id => id.toString()) } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } }
    ]);

    const postCountMap = {};
    postCounts.forEach(pc => {
      postCountMap[pc._id] = pc.count;
    });

    const detailedUsers = users.map(user => ({
      ...user.toObject(),
      postCount: postCountMap[user._id.toString()] || 0
    }));

    res.status(200).json(detailedUsers);
  } catch (err) {
    console.error("users-detailed error:", err);
    res.status(500).json(err);
  }
});

// GET /api/admin/posts-detailed - Get detailed post information
router.get("/posts-detailed", validateAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "username profilePicture")
      .lean();

    res.status(200).json(posts);
  } catch (err) {
    console.error("posts-detailed error:", err);
    res.status(500).json(err);
  }
});

// GET /api/admin/products-detailed - Get detailed product information
router.get("/products-detailed", validateAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);
    
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "username profilePicture")
      .lean();

    res.status(200).json(products);
  } catch (err) {
    console.error("products-detailed error:", err);
    res.status(500).json(err);
  }
});

// ============ POSTS MANAGEMENT ============

// PUT /api/admin/posts/:id - Update post status
router.put("/posts/:id", validateAdmin, async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("userId", "username profilePicture");

    if (!updatedPost) {
      return res.status(404).json("Post not found");
    }

    res.status(200).json(updatedPost);
  } catch (err) {
    console.error("Update post error:", err);
    res.status(500).json(err);
  }
});

// DELETE /api/admin/posts/:id - Delete post
router.delete("/posts/:id", validateAdmin, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json("Post deleted successfully");
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json(err);
  }
});

// ============ PRODUCTS MANAGEMENT ============

// PUT /api/admin/products/:id - Update product status
router.put("/products/:id", validateAdmin, async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("userId", "username profilePicture");

    if (!updatedProduct) {
      return res.status(404).json("Product not found");
    }

    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json(err);
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete("/products/:id", validateAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json("Product deleted successfully");
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json(err);
  }
});

// ============ ADS MANAGEMENT ============

// GET /api/admin/ads - Get all ads for management
router.get("/ads", validateAdmin, async (req, res) => {
  try {
    const ads = await Ad.find({})
      .sort({ createdAt: -1 })
      .populate("createdBy", "username")
      .lean();

    res.status(200).json(ads);
  } catch (err) {
    console.error("Get ads error:", err);
    res.status(500).json(err);
  }
});

// POST /api/admin/ads - Create new ad
router.post("/ads", validateAdmin, async (req, res) => {
  try {
    const newAd = new Ad({
      ...req.body,
      createdBy: req.adminUser._id
    });

    const savedAd = await newAd.save();
    await savedAd.populate("createdBy", "username");
    
    res.status(201).json(savedAd);
  } catch (err) {
    console.error("Create ad error:", err);
    res.status(500).json(err);
  }
});

// PUT /api/admin/ads/:id - Update ad
router.put("/ads/:id", validateAdmin, async (req, res) => {
  try {
    const updatedAd = await Ad.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).populate("createdBy", "username");

    if (!updatedAd) {
      return res.status(404).json("Ad not found");
    }

    res.status(200).json(updatedAd);
  } catch (err) {
    console.error("Update ad error:", err);
    res.status(500).json(err);
  }
});

// DELETE /api/admin/ads/:id - Delete ad
router.delete("/ads/:id", validateAdmin, async (req, res) => {
  try {
    await Ad.findByIdAndDelete(req.params.id);
    res.status(200).json("Ad deleted successfully");
  } catch (err) {
    console.error("Delete ad error:", err);
    res.status(500).json(err);
  }
});

// PUT /api/admin/ads/:id/click - Track ad click
router.put("/ads/:id/click", async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } });
    res.status(200).json("Click tracked");
  } catch (err) {
    console.error("Track click error:", err);
    res.status(500).json(err);
  }
});

// PUT /api/admin/ads/:id/impression - Track ad impression
router.put("/ads/:id/impression", async (req, res) => {
  try {
    await Ad.findByIdAndUpdate(req.params.id, { $inc: { impressionCount: 1 } });
    res.status(200).json("Impression tracked");
  } catch (err) {
    console.error("Track impression error:", err);
    res.status(500).json(err);
  }
});

module.exports = router;

