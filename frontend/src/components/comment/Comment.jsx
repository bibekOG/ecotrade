import React, { useState, useEffect, useContext, useCallback } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import { format } from "timeago.js";
import "./comment.css";

export default function Comment({ postId, onCommentAdded, open }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";

  const fetchComments = useCallback(async () => {
    try {
      const res = await apiClient.get(`/comments/${postId}`);
      setComments(res.data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [postId]);

  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [open, fetchComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await apiClient.post("/comments", {
        postId: postId,
        userId: user._id,
        text: newComment,
      });

      setNewComment("");
      fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await apiClient.delete(`/comments/${commentId}`, {
        data: { userId: user._id }
      });
      fetchComments();
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  // Function to get profile picture URL
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) {
      return `${PF}person/noAvatar.png`;
    }

    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }

    return `${PF}${profilePicture}`;
  };

  return (
    <div className="commentSection">
      {open && (
        <div className="commentsContainer">
          {/* Comment Form */}
          <form className="commentForm" onSubmit={handleSubmitComment}>
            <img
              className="commentProfileImg"
              src={getProfilePictureUrl(user.profilePicture)}
              alt="Profile"
              onError={(e) => {
                e.target.src = `${PF}person/noAvatar.png`;
              }}
            />
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="commentInput"
              disabled={loading}
            />
            <button
              type="submit"
              className="commentSubmitBtn"
              disabled={loading || !newComment.trim()}
            >
              {loading ? "Posting..." : "Post"}
            </button>
          </form>

          {/* Comments List */}
          <div className="commentsList">
            {comments.length === 0 ? (
              <p className="noComments">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="commentItem">
                  <img
                    className="commentProfileImg"
                    src={getProfilePictureUrl(comment.profilePicture)}
                    alt="Profile"
                    onError={(e) => {
                      e.target.src = `${PF}person/noAvatar.png`;
                    }}
                  />
                  <div className="commentContent">
                    <div className="commentHeader">
                      <span className="commentUsername">{comment.username}</span>
                      <span className="commentDate">{format(comment.createdAt)}</span>
                    </div>
                    <p className="commentText">{comment.text}</p>
                  </div>
                  {comment.userId === user._id && (
                    <button
                      className="deleteCommentBtn"
                      onClick={() => handleDeleteComment(comment._id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

