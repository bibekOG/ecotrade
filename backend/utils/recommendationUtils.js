const UserTagInteraction = require("../models/UserTagInteraction");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const User = require("../models/User");

// Extract hashtags from post description
const extractTagsFromText = (desc = "") => {
  if (typeof desc !== "string") return [];
  const regex = /#(\w+)/g;
  const tags = [];
  let match;
  while ((match = regex.exec(desc)) !== null) {
    tags.push(match[1].toLowerCase());
  }
  return tags;
};

// Convert Map/Object to plain object (normalize tag map)
const normalizeTagMap = (tagMap) => {
  const out = {};
  if (!tagMap) return out;

  // tagMap can be a Map or a plain object depending on how Mongoose serialized it
  const entries = tagMap instanceof Map ? tagMap.entries() : Object.entries(tagMap);

  for (const [tag, weight] of entries) {
    if (!tag) continue;
    const w = Number(weight) || 0;
    if (w > 0) {
      out[String(tag).toLowerCase()] = w;
    }
  }
  return out;
};

// Cosine similarity between two sparse tag vectors
const cosineSimilarity = (vecA, vecB) => {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const k of keys) {
    const a = vecA[k] || 0;
    const b = vecB[k] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Compute pairwise user similarities with detailed comparison including vectors
const computeUserSimilarities = async () => {
  const records = await UserTagInteraction.find().lean();
  const userVectors = {};

  // Normalize all tag maps
  records.forEach((r) => {
    const userId = String(r.userId);
    userVectors[userId] = normalizeTagMap(r.tagInteractions);
  });

  const similarities = [];
  const userIds = Object.keys(userVectors);

  // Compute similarity between every pair of users
  for (let i = 0; i < userIds.length; i++) {
    for (let j = i + 1; j < userIds.length; j++) {
      const u1 = userIds[i];
      const u2 = userIds[j];
      const sim = cosineSimilarity(userVectors[u1], userVectors[u2]);

      // Only include similarities greater than 0
      if (sim > 0) {
        similarities.push({
          userA: u1,
          userB: u2,
          vectorA: { ...userVectors[u1] }, // Copy vector for transparency
          vectorB: { ...userVectors[u2] }, // Copy vector for transparency
          similarity: Number(sim.toFixed(4)),
        });
      }
    }
  }

  return similarities;
};

// Update a user's tag interaction vector in response to an action
const ACTION_WEIGHTS = {
  like: 1,
  comment: 2,
  view: 0.5,
  unlike: -1,
};

const updateUserTagInteractions = async (userId, tags = [], action = "like") => {
  if (!userId || !Array.isArray(tags) || tags.length === 0) return;

  const weight = ACTION_WEIGHTS[action] ?? 0.5;
  let record = await UserTagInteraction.findOne({ userId });

  if (!record) {
    record = new UserTagInteraction({
      userId,
      tagInteractions: new Map(),
    });
  }

  tags.forEach((raw) => {
    const tag = String(raw).toLowerCase();
    const current = record.tagInteractions.get(tag) || 0;
    const next = Math.max(0, current + weight); // Ensure non-negative
    record.tagInteractions.set(tag, next);
  });

  record.lastUpdated = new Date();
  await record.save();
};

// Score a post for a specific user (Content-Based + Collaborative Filtering)
const scorePostForUser = (userVector, postTags, postLikes, postUserId, similarUsers, userId) => {
  // Create post vector (binary representation: 1 if tag exists, 0 otherwise)
  const postVector = {};
  postTags.forEach((t) => {
    const tag = String(t).toLowerCase();
    postVector[tag] = 1;
  });

  // 1. Content-based score using cosine similarity
  const contentScore = cosineSimilarity(userVector, postVector);

  // 2. Collaborative score: weight based on similar users who actually liked this post
  let collabScore = 0;
  const likeSet = new Set(Array.isArray(postLikes) ? postLikes.map(String) : []);
  
  similarUsers.forEach((u) => {
    const similarUserId = String(u.userId);
    const similarity = u.similarity || 0;
    
    if (similarUserId !== userId && similarity > 0) {
      // Check if similar user actually liked this post
      if (likeSet.has(similarUserId)) {
        collabScore += similarity; // Full weight if they liked it
      }
      
      // Additional weight if similar user is the author (content from similar users)
      if (String(postUserId) === similarUserId) {
        collabScore += similarity * 0.5; // Half weight for authorship
      }
    }
  });

  // Combine scores: 70% content-based, 30% collaborative
  const finalScore = contentScore * 0.7 + collabScore * 0.3;

  return {
    contentScore: Number(contentScore.toFixed(4)),
    collabScore: Number(collabScore.toFixed(4)),
    finalScore: Number(finalScore.toFixed(4)),
    tags: postTags,
  };
};

// Full recommendation function with detailed scoring
const recommendPostsForUser = async (userId, limit = 10) => {
  // Get user's tag interaction record
  const userRecord = await UserTagInteraction.findOne({ userId });
  if (!userRecord) {
    // Return empty array if user has no interaction history
    return [];
  }

  // Normalize user's tag vector
  const userVector = normalizeTagMap(userRecord.tagInteractions);

  // Get global user similarities with detailed comparison
  const similarities = await computeUserSimilarities();

  // Filter and map top similar users for this specific user
  const similarUsers = similarities
    .filter((s) => s.userA === userId || s.userB === userId)
    .map((s) => ({
      userId: s.userA === userId ? s.userB : s.userA,
      similarity: s.similarity,
      vectorA: s.userA === userId ? s.vectorA : s.vectorB,
      vectorB: s.userA === userId ? s.vectorB : s.vectorA,
    }))
    .filter((u) => u.similarity > 0.1) // Apply similarity threshold
    .sort((a, b) => b.similarity - a.similarity); // Sort by similarity descending

  // Fetch all candidate posts (exclude user's own to diversify recommendations)
  const posts = await Post.find({ userId: { $ne: userId } })
    .select("userId tags desc description likes createdAt img");

  const scores = [];

  // Score each post for the user
  for (const post of posts) {
    // Extract tags from post (check both tags array and description)
    const tags = Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags.map((t) => String(t).toLowerCase())
      : extractTagsFromText(post.desc || post.description || "");

    // Skip posts with no tags
    if (tags.length === 0) continue;

    // Score the post using content-based and collaborative filtering
    const score = scorePostForUser(
      userVector,
      tags,
      post.likes || [], // Pass actual likes array
      post.userId, // Pass post author ID
      similarUsers,
      userId
    );

    scores.push({
      postId: post._id,
      post: {
        _id: post._id,
        userId: post.userId,
        desc: post.desc,
        description: post.description,
        img: post.img,
        tags: post.tags,
        likes: post.likes,
        createdAt: post.createdAt,
      },
      tags,
      contentScore: score.contentScore,
      collabScore: score.collabScore,
      finalScore: score.finalScore,
    });
  }

  // Sort by final score (highest first)
  scores.sort((a, b) => b.finalScore - a.finalScore);

  // Return top N recommendations
  return scores.slice(0, limit);
};

module.exports = {
  extractTagsFromText,
  normalizeTagMap,
  cosineSimilarity,
  updateUserTagInteractions,
  computeUserSimilarities,
  scorePostForUser,
  recommendPostsForUser,
};

