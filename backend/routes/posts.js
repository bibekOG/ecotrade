const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const UserTagInteraction = require("../models/UserTagInteraction");
const {
  extractTagsFromText,
  cosineSimilarity,
  updateUserTagInteractions,
  normalizeTagMap,
} = require("../utils/recommendationUtils");
const {
  createLikeNotification,
  removeLikeNotification,
  createNewPostNotification,
} = require("../utils/notificationService");

//create a post
router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  
  // Extract tags from description
  if (req.body.desc) {
    newPost.tags = extractTagsFromText(req.body.desc);
  }
  
  try {
    const savedPost = await newPost.save();
    
    // Notify friends about the new post
    try {
      const postAuthor = await User.findById(req.body.userId).select("followers");
      if (postAuthor && Array.isArray(postAuthor.followers) && postAuthor.followers.length > 0) {
        // Get friends (people who follow the author)
        const friendIds = postAuthor.followers.map(f => f.toString()).filter(id => id);
        if (friendIds.length > 0) {
          await createNewPostNotification(savedPost._id, req.body.userId, friendIds);
          console.log(`Notified ${friendIds.length} friends about new post ${savedPost._id}`);
        }
      }
    } catch (notificationError) {
      console.error("Error creating new post notifications:", notificationError);
      // Don't fail the post creation if notification fails
    }
    
    res.status(200).json(savedPost);
  } catch (err) {
    res.status(500).json(err);
  }
});

//update a post
router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      // Extract tags from description if it's being updated
      if (req.body.desc) {
        req.body.tags = extractTagsFromText(req.body.desc);
      }
      
      await post.updateOne({ $set: req.body });
      res.status(200).json("the post has been updated");
    } else {
      res.status(403).json("you can update only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//delete a post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json("the post has been deleted");
    } else {
      res.status(403).json("you can delete only your post");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//like / dislike a post
router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      
      // Update user tag interactions when liking
      if (post.tags && post.tags.length > 0) {
        await updateUserTagInteractions(req.body.userId, post.tags, 'like');
      }
      
      // Create notification for like
      try {
        await createLikeNotification(post._id, req.body.userId, post.userId);
      } catch (notificationError) {
        console.error("Error creating like notification:", notificationError);
      }
      
      res.status(200).json("The post has been liked");
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      
      // Update user tag interactions when unliking
      if (post.tags && post.tags.length > 0) {
        await updateUserTagInteractions(req.body.userId, post.tags, 'unlike');
      }
      
      // Remove notification for unlike
      try {
        await removeLikeNotification(post._id, req.body.userId, post.userId);
      } catch (notificationError) {
        console.error("Error removing like notification:", notificationError);
      }
      
      res.status(200).json("The post has been disliked");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

//get a post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get timeline posts
router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.status(200).json(userPosts.concat(...friendPosts));
  } catch (err) {
    res.status(500).json(err);
  }
});

//get user's all posts
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const posts = await Post.find({ userId: user._id });
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get recommended posts (user-specific)
router.get("/recommended/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(userId).lean();
    if (!currentUser) return res.status(404).json("User not found");

    // Build the current user's preference vector
    const allInteractions = await UserTagInteraction.find().lean();
    const interactionByUser = new Map(
      allInteractions.map((doc) => [String(doc.userId), doc])
    );

    const baseVector = normalizeTagMap(
      interactionByUser.get(userId)?.tagInteractions || {}
    );

    // Enrich with declared interests to avoid cold-start zeros
    if (Array.isArray(currentUser.interest)) {
      currentUser.interest.forEach((raw) => {
        const tag = String(raw || "").toLowerCase();
        if (!tag) return;
        baseVector[tag] = (baseVector[tag] || 0) + 1;
      });
    }

    // Compute similarities to other users based on tag vectors
    const similarityScores = [];
    for (const doc of allInteractions) {
      const otherId = String(doc.userId);
      if (otherId === userId) continue;

      const otherVec = normalizeTagMap(doc.tagInteractions);
      if (Object.keys(otherVec).length === 0) continue;

      const similarity = cosineSimilarity(baseVector, otherVec);
      if (similarity > 0) {
        similarityScores.push({ userId: otherId, similarity });
      }
    }

    similarityScores.sort((a, b) => b.similarity - a.similarity);
    const topSimilar = similarityScores.slice(0, 20);
    const similarityMap = new Map(
      topSimilar.map((item) => [item.userId, item.similarity])
    );
    const similarUserIds = topSimilar.map((item) => item.userId);

    // If we have no signals at all, fall back to fresh content
    if (Object.keys(baseVector).length === 0 && similarityMap.size === 0) {
      const fallback = await Post.find({ userId: { $ne: userId } })
        .sort({ createdAt: -1 })
        .limit(20);
      return res.status(200).json(fallback);
    }

    // Pre-compute collaborative weights from comments by similar users
    let commentWeightsByPost = new Map();
    if (similarUserIds.length > 0) {
      const comments = await Comment.find({ userId: { $in: similarUserIds } })
        .select("postId userId");

      commentWeightsByPost = comments.reduce((map, comment) => {
        const sim = similarityMap.get(String(comment.userId)) || 0;
        const pid = String(comment.postId);
        map.set(pid, (map.get(pid) || 0) + sim);
        return map;
      }, new Map());
    }

    const candidatePosts = await Post.find({ userId: { $ne: userId } })
      .select("userId tags createdAt likes desc img");

    const scoredPosts = candidatePosts.map((post) => {
      const postId = String(post._id);

      // Content-based score: match tags the user frequently interacts with
      let contentScore = 0;
      if (Array.isArray(post.tags) && post.tags.length > 0) {
        for (const rawTag of post.tags) {
          const tag = String(rawTag).toLowerCase();
          contentScore += baseVector[tag] || 0;
        }
      }

      // Collaborative score: weight likes/comments by similar users
      let likeScore = 0;
      if (similarityMap.size && Array.isArray(post.likes) && post.likes.length > 0) {
        for (const liker of post.likes) {
          likeScore += similarityMap.get(String(liker)) || 0;
        }
      }

      const commentScore = commentWeightsByPost.get(postId) || 0;
      const collaborativeScore = likeScore * 1 + commentScore * 1.2;

      // Combine the signals
      const score = contentScore * 0.6 + collaborativeScore * 0.4;

      return { ...post.toObject(), score };
    });

    const ranked = scoredPosts
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ score, ...rest }) => rest);

    if (ranked.length === 0) {
      const fallback = await Post.find({ userId: { $ne: userId } })
        .sort({ createdAt: -1 })
        .limit(20);
      return res.status(200).json(fallback);
    }

    return res.status(200).json(ranked);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get friends posts
router.get("/friends/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    if (!currentUser) {
      return res.status(404).json("User not found");
    }

    // Get array of friend IDs (followings) and normalize to strings to match Post.userId schema
    const friendIds = (Array.isArray(currentUser.followings) ? currentUser.followings : []).map(id => String(id));
    
    if (friendIds.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch all posts from friends in a single query (more efficient)
    const friendPosts = await Post.find({
      userId: { $in: friendIds }
    })
      .sort({ createdAt: -1 });

    res.status(200).json(friendPosts);
  } catch (err) {
    console.error("Error fetching friends posts:", err);
    res.status(500).json(err);
  }
});

//get recent posts
router.get("/recent", async (req, res) => {
  try {
    // All posts across users ordered by posted time (newest first)
    const recentPosts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(recentPosts);
  } catch (err) {
    res.status(500).json(err);
  }
});

//get my posts
router.get("/my/:userId", async (req, res) => {
  try {
    const userPosts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json(userPosts);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
