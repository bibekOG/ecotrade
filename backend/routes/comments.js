const router = require("express").Router();
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const { updateUserTagInteractions } = require("../utils/recommendationUtils");
const { createCommentNotification } = require("../utils/notificationService");

// Create a comment
router.post("/", async (req, res) => {
  try {
    const newComment = new Comment(req.body);
    const savedComment = await newComment.save();
    
    // Load the post once for tag extraction and notifications
    const post = await Post.findById(req.body.postId);

    // Update post comment count
    await Post.findByIdAndUpdate(req.body.postId, {
      $inc: { comment: 1 }
    });

    // Update tag interaction vector for the commenting user
    if (post && Array.isArray(post.tags) && post.tags.length > 0) {
      try {
        await updateUserTagInteractions(req.body.userId, post.tags, "comment");
      } catch (tagErr) {
        console.error("Error updating tag interactions after comment:", tagErr);
      }
    }
    
    // Create notification for comment
    try {
      if (post) {
        console.log('Creating comment notification:', {
          postId: req.body.postId,
          commentId: savedComment._id,
          senderId: req.body.userId,
          recipientId: post.userId,
          commentText: req.body.text
        });
        
        const notification = await createCommentNotification(
          req.body.postId,
          savedComment._id,
          req.body.userId,
          post.userId,
          req.body.text
        );
        
        if (notification) {
          console.log('✅ Comment notification created successfully:', notification._id);
        } else {
          console.log('⚠️ Comment notification not created (user commenting on own post)');
        }
      } else {
        console.error('Post not found for comment notification:', req.body.postId);
      }
    } catch (notificationError) {
      console.error("❌ Error creating comment notification:", notificationError);
    }
    
    res.status(200).json(savedComment);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Get comments for a post
router.get("/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId })
      .sort({ createdAt: -1 });
    
    // Get user details for each comment
    const commentsWithUser = await Promise.all(
      comments.map(async (comment) => {
        const user = await User.findById(comment.userId);
        return {
          ...comment.toObject(),
          username: user.username,
          profilePicture: user.profilePicture
        };
      })
    );
    
    res.status(200).json(commentsWithUser);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Delete a comment
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (comment.userId === req.body.userId) {
      await comment.deleteOne();
      
      // Update post comment count
      await Post.findByIdAndUpdate(comment.postId, {
        $inc: { comment: -1 }
      });
      
      res.status(200).json("Comment has been deleted");
    } else {
      res.status(403).json("You can delete only your comment");
    }
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
