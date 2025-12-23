import "./post.css";
import { MoreVert, ThumbUp, ThumbUpAltOutlined, ChatBubbleOutline, ShareOutlined, Cancel, PermMedia } from "@material-ui/icons";
import { useContext, useEffect, useRef, useState } from "react";
import apiClient from "../../utils/apiClient";
import { format } from "timeago.js";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import Comment from "../comment/Comment";

export default function Post({ post }) {
  const [like, setLike] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const [edit, setEdit] = useState(false);
  const [user, setUser] = useState({});
  const [postTextEdit, setPostTextEdit] = useState(post?.desc);
  const [editfile, setEditFile] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef();

  const postWords = useRef();
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
  const { user: currentUser } = useContext(AuthContext);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setIsLiked(false);
      return;
    }
    setIsLiked(post.likes.includes(currentUser._id));
  }, [currentUser, post.likes]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchUser = async () => {
      try {
        const res = await apiClient.get(`/users?userId=${post.userId}`);
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUser();
  }, [post.userId, currentUser, post.comment]);

  const likeHandler = () => {
    if (!currentUser) return;
    try {
      apiClient.put("/posts/" + post._id + "/like", { userId: currentUser._id });
    } catch (err) { }
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
  };

  const handleEdit = () => {
    if (!currentUser) return;
    setEdit(!edit);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleShareClick = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
    setShowShareMenu(false);
  };

  const handleRepost = async () => {
    if (!currentUser) return;
    try {
      if (window.confirm("Share this post to your feed?")) {
        await apiClient.post("/posts", {
          userId: currentUser._id,
          desc: post.desc,
          img: post.img,
        });
        alert("Post shared successfully!");
        window.location.reload();
      }
    } catch (err) {
      console.error("Error sharing post:", err);
      alert("Failed to share post.");
    }
    setShowShareMenu(false);
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const UpdatedPost = {
      userId: currentUser._id,
      desc: postWords.current.value
    };

    if (editfile) {
      const data = new FormData();
      const fileName = Date.now() + editfile.name;
      data.append("name", fileName);
      data.append("file", editfile);
      UpdatedPost.img = fileName;
      try {
        await apiClient.post("/upload", data);
      } catch (err) { }
    }

    try {
      await apiClient.put("/posts/" + post._id, UpdatedPost);
      window.location.reload();
    } catch (err) {
      console.log(err);
    }
  };

  const renderTextWithTags = (text) => {
    if (!text) return "";
    const tagRegex = /#(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <span key={match.index} className="postTag">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) return `${PF}person/noAvatar.png`;
    if (profilePicture.startsWith('http')) return profilePicture;
    return `${PF}${profilePicture}`;
  };

  const handleCommentAdded = () => {
    window.location.reload();
  };

  return (
    <div className="post">
      <div className="postWrapper">
        <div className="postTop">
          <div className="postTopLeft">
            <Link to={`/profile/${user.username}`}>
              <img
                className="postProfileImg"
                src={getProfilePictureUrl(user.profilePicture)}
                alt="Profile"
                onError={(e) => { e.target.src = `${PF}person/noAvatar.png`; }}
              />
            </Link>
            <div className="postInfo">
              <span className="postUsername">{user.username}</span>
              <span className="postDate">{format(post.createdAt)}</span>
            </div>
          </div>
          <div className="postTopRight">
            {/* Comment Count at the Top */}
            <span className="topCommentCount" onClick={toggleComments} style={{ cursor: 'pointer' }}>
              {post.comment ? `${post.comment} comments` : "0 comments"}
            </span>

            {currentUser?._id === post.userId && (
              <div className="postOptions">
                <span className="editButton" onClick={handleEdit}>
                  {edit ? "Cancel" : "Edit"}
                </span>
                <MoreVert className="moreIcon" />
              </div>
            )}
          </div>
        </div>

        <div className="postCenter">
          {edit ? (
            <div className="editContainer">
              <textarea
                className="postTextEdit"
                placeholder={post?.desc}
                onChange={(e) => setPostTextEdit(e.target.value)}
                value={postTextEdit}
                ref={postWords}
              />
              {editfile && (
                <div className="shareImgContainer">
                  <img className="shareImg" src={URL.createObjectURL(editfile)} alt="" />
                  <Cancel className="shareCancelImg" onClick={() => setEditFile(null)} />
                </div>
              )}
              <div className="editActions">
                <label htmlFor={`editfile-${post._id}`} className="shareOption">
                  <PermMedia htmlColor="tomato" className="shareIcon" />
                  <span className="shareOptionText">Photo/Video</span>
                  <input
                    style={{ display: "none" }}
                    type="file"
                    id={`editfile-${post._id}`}
                    accept=".png,.jpeg,.jpg"
                    onChange={(e) => setEditFile(e.target.files[0])}
                  />
                </label>
                <button className="updatePost" onClick={handleSubmitEdit}>Update Post</button>
              </div>
            </div>
          ) : (
            <>
              <span className="postText">{renderTextWithTags(post?.desc)}</span>
              {post.img && (
                <img
                  className="postImg"
                  src={post.img.startsWith('http') ? post.img : `${PF}${post.img}`}
                  alt=""
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </>
          )}
        </div>

        {/* Stats Row */}
        <div className="postStats">
          <div className="postStatsLeft">
            <img className="likeIcon" src={`${PF}like.png`} alt="" />
            <img className="likeIcon" src={`${PF}heart.png`} alt="" />
            <span className="postLikeCounter">{like} people like it</span>
          </div>
          <div className="postStatsRight">
            {/* Bottom comment count can persist or refer to top */}
          </div>
        </div>

        <div className="postDivider"></div>

        {/* Action Buttons */}
        <div className="postBottom">
          <div className={`postBottomAction ${isLiked ? "active" : ""}`} onClick={likeHandler}>
            {isLiked ? <ThumbUp className="actionIcon" /> : <ThumbUpAltOutlined className="actionIcon" />}
            <span>Like</span>
          </div>
          <div className={`postBottomAction ${showComments ? "active" : ""}`} onClick={toggleComments}>
            <ChatBubbleOutline className="actionIcon" />
            <span>Comment</span>
          </div>
          <div className="postBottomAction" onClick={handleShareClick} style={{ position: 'relative' }}>
            <ShareOutlined className="actionIcon" />
            <span>Share</span>

            {showShareMenu && (
              <div className="shareMenu" ref={shareMenuRef}>
                <div className="shareMenuItem" onClick={handleCopyLink}>
                  <span>Copy Link</span>
                </div>
                <div className="shareMenuItem" onClick={handleRepost}>
                  <span>Share to Feed</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="postDivider"></div>

        <Comment postId={post._id} onCommentAdded={handleCommentAdded} open={showComments} />
      </div>
    </div>
  );
}
