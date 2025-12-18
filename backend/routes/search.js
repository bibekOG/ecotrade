const router = require("express").Router();
const User = require("../models/User");
const Post = require("../models/Post");
const Product = require("../models/Product");
const { computeUserSimilarities } = require("../utils/recommendationUtils");

// Search across all content types
router.get("/", async (req, res) => {
  try {
    const { q, type } = req.query;
    
    // Validate query
    if (!q || typeof q !== "string" || q.trim() === "") {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchTerm = q.trim();
    const regexPattern = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i");
    let results = [];

    try {
      // Search based on type or all if no type specified
      if (!type || type === "all") {
        // Search users - username, fullName, email, bio
        const users = await User.find({
          $or: [
            { username: { $regex: regexPattern } },
            { fullName: { $regex: regexPattern } },
            { email: { $regex: regexPattern } },
            { bio: { $regex: regexPattern } }
          ],
          status: { $ne: "banned" }
        })
        .select("username fullName email profilePicture bio")
        .limit(10)
        .lean();

        // Search posts - desc (caption) and tags
        // Note: Post model has userId as String, not ObjectId
        // Tags is an array of strings, search in array using $in with regex
        const posts = await Post.find({
          $or: [
            { desc: { $regex: regexPattern } },
            { tags: { $regex: regexPattern } }
          ]
        })
        .limit(10)
        .lean();

        // Manually populate user data for posts since userId is a string
        const processedPosts = await Promise.all(posts.map(async (post) => {
          if (post.userId) {
            try {
              const user = await User.findById(post.userId).select("username fullName profilePicture").lean();
              if (user) {
                return {
                  ...post,
                  userId: {
                    _id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    profilePicture: user.profilePicture
                  }
                };
              }
            } catch (err) {
              console.error(`Error populating user for post ${post._id}:`, err);
            }
          }
          return post;
        }));

        // Search products
        const products = await Product.find({
          $or: [
            { productName: { $regex: regexPattern } },
            { productDescription: { $regex: regexPattern } },
            { productCategory: { $regex: regexPattern } }
          ],
          status: "Active"
        })
        .populate("userId", "username fullName profilePicture")
        .limit(10)
        .lean();

        results = [
          ...users.map(user => ({ 
            ...user, 
            type: "user",
            _id: user._id.toString()
          })),
          ...processedPosts.map(post => ({ 
            ...post, 
            type: "post",
            _id: post._id.toString()
            // Keep userId as object if populated, or as string if not
          })),
          ...products.map(product => ({ 
            ...product, 
            type: "product",
            _id: product._id.toString()
          }))
        ];

        console.log(`Search for "${searchTerm}": Found ${users.length} users, ${processedPosts.length} posts, ${products.length} products`);
      } else if (type === "users" || type === "user") {
        const users = await User.find({
          $or: [
            { username: { $regex: regexPattern } },
            { fullName: { $regex: regexPattern } },
            { email: { $regex: regexPattern } },
            { bio: { $regex: regexPattern } }
          ],
          status: { $ne: "banned" }
        })
        .select("username fullName email profilePicture bio")
        .lean();
        
        results = users.map(user => ({ 
          ...user, 
          type: "user",
          _id: user._id.toString()
        }));
      } else if (type === "posts" || type === "post") {
        const posts = await Post.find({
          $or: [
            { desc: { $regex: regexPattern } },
            { tags: { $regex: regexPattern } }
          ]
        })
        .lean();

        // Manually populate user data for posts
        const processedPosts = await Promise.all(posts.map(async (post) => {
          if (post.userId) {
            try {
              const user = await User.findById(post.userId).select("username fullName profilePicture").lean();
              if (user) {
                return {
                  ...post,
                  userId: {
                    _id: user._id,
                    username: user.username,
                    fullName: user.fullName,
                    profilePicture: user.profilePicture
                  }
                };
              }
            } catch (err) {
              console.error(`Error populating user for post ${post._id}:`, err);
            }
          }
          return post;
        }));

        results = processedPosts.map(post => ({ 
          ...post, 
          type: "post",
          _id: post._id.toString()
        }));
      } else if (type === "products" || type === "product") {
        const products = await Product.find({
          $or: [
            { productName: { $regex: regexPattern } },
            { productDescription: { $regex: regexPattern } },
            { productCategory: { $regex: regexPattern } }
          ],
          status: "Active"
        })
        .populate("userId", "username fullName profilePicture")
        .lean();
        
        results = products.map(product => ({ 
          ...product, 
          type: "product",
          _id: product._id.toString()
        }));
      }

      console.log(`Total results returned: ${results.length}`);
      res.status(200).json(results);
    } catch (dbError) {
      console.error("Database search error:", dbError);
      res.status(500).json({ error: "Database search failed", details: dbError.message });
    }
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed", details: err.message });
  }
});

// GET /api/search/similarity-matrix - Get detailed user similarity comparison matrix
// This endpoint returns the full user similarity matrix with vectors for analysis
router.get("/similarity-matrix", async (req, res) => {
  try {
    const similarities = await computeUserSimilarities();
    
    // Optionally populate with user details for better readability
    const userIds = new Set();
    similarities.forEach(s => {
      userIds.add(s.userA);
      userIds.add(s.userB);
    });
    
    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select("username fullName email")
      .lean();
    
    const userMap = new Map(users.map(u => [String(u._id), u]));
    
    // Enrich similarities with user details
    const enrichedSimilarities = similarities.map(sim => ({
      ...sim,
      userADetails: userMap.get(sim.userA) || { _id: sim.userA },
      userBDetails: userMap.get(sim.userB) || { _id: sim.userB },
    }));
    
    res.status(200).json({
      totalComparisons: enrichedSimilarities.length,
      similarities: enrichedSimilarities,
    });
  } catch (err) {
    console.error("Error computing user similarities:", err);
    res.status(500).json({ error: "Failed to compute user similarities", details: err.message });
  }
});

module.exports = router;
