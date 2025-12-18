import "./post.css";
import { MoreVert } from "@material-ui/icons";
import { useContext, useEffect, useRef, useState } from "react";
import apiClient from "../../utils/apiClient";
import { format } from "timeago.js";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {Cancel,
    PermMedia} from "@material-ui/icons";
import Comment from "../comment/Comment";

export default function Post({ post }) {
  const [like, setLike] = useState(post.likes.length);
  const [isLiked, setIsLiked] = useState(false);
  const [edit,setEdit]=useState(false)
  const [user, setUser] = useState({});
  const [inputEdit,setInputEdit]=useState({})
  const [postTextEdit,setPostTextEdit]=useState(post?.desc)
  const image = useRef()
  const postWords = useRef()
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
  const { user: currentUser } = useContext(AuthContext);
  const [editfile, setEditFile] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setIsLiked(false);
      return;
    }
    setIsLiked(post.likes.includes(currentUser._id));
  }, [currentUser._id, post.likes]);

  useEffect(() => {
    if (!currentUser) {
      // Don't fetch user data if there's no authenticated user
      return;
    }
    
    const fetchUser = async () => {
      try {
        const res = await apiClient.get(`/users?userId=${post.userId}`);
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUser();
  }, [post.userId, currentUser]);

  const likeHandler = () => {
    if (!currentUser) {
      console.log("No authenticated user, cannot like post");
      return;
    }
    
    try {
      apiClient.put("/posts/" + post._id + "/like", { userId: currentUser._id });
    } catch (err) {}
    setLike(isLiked ? like - 1 : like + 1);
    setIsLiked(!isLiked);
  };

  const handleEdit = async(e)=>{
    if (!currentUser) {
      console.log("No authenticated user, cannot edit post");
      return;
    }
    // postWords.current.style.display = "none"
    setEdit(!edit)
    
  }
  const handleSubmitEdit = async(e)=>{
    e.preventDefault();
    if (!currentUser) {
      console.log("No authenticated user, cannot submit edit");
      return;
    }
    
    const UpdatedPost ={
      userId:currentUser._id,
      desc:postWords.current.value

    }
    
    
    if (editfile) {
      const data = new FormData();
      const fileName = Date.now() + editfile.name;
      data.append("name", fileName);
      data.append("file", editfile);
      UpdatedPost.img = fileName;
      console.log(UpdatedPost);
      try {
        await apiClient.post("/upload", data);
      } catch (err) {
        console.log(err)
      }
    }
    try {
      const res= await apiClient.put("/posts/"+post._id, UpdatedPost);
      console.log(res.data)
      window.location.reload();
    } catch (err) {
      console.log(err)
    }
  }

  // Function to render text with highlighted tags
  const renderTextWithTags = (text) => {
    if (!text) return "";
    
    const tagRegex = /#(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = tagRegex.exec(text)) !== null) {
      // Add text before the tag
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the highlighted tag
      parts.push(
        <span key={match.index} className="postTag">
          {match[0]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts;
  };

  // Function to get profile picture URL
  const getProfilePictureUrl = (profilePicture) => {
    if (!profilePicture) {
      return `${PF}person/noAvatar.png`;
    }
    
    // If it's already a full URL (starts with http/https)
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      return profilePicture;
    }
    
    // If it's a relative path, prepend the public folder
    return `${PF}${profilePicture}`;
  };

  const handleCommentAdded = () => {
    // Refresh the post to update comment count
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
                onError={(e) => {
                  e.target.src = `${PF}person/noAvatar.png`;
                }}
              />
            </Link>
            <span className="postUsername">{user.username}</span>
            <span className="postDate">{format(post.createdAt)}</span>
          </div>
          { currentUser?._id === post.userId &&
           <div className="postTopRight"
           onClick={handleEdit}>
           <div className="edit" onClick={()=>setEdit(!edit)}>{edit ? "Cancel":"Edit"}</div> <MoreVert />
          </div>
          }
        </div>
        <div className="postCenter">
          {edit ?
          <>
           <textarea className="postTextEdit" placeholder={post?.desc} onChange={(e)=>setPostTextEdit(e.target.value)}  value={postTextEdit} ref={postWords}/> 
           </> 
            :
            <span className="postText" >{renderTextWithTags(post?.desc)}</span> 
            }
         { edit ? 
          <>
          {editfile && (
            <div className="shareImgContainer">
              <img className="shareImg" src={URL.createObjectURL(editfile)} alt="" />
              <Cancel className="shareCancelImg" onClick={() => setEditFile(null)} />
            </div>
          )}
          {editfile ?
          <button className="updatePost" type="submit" onClick={handleSubmitEdit}>Update</button>
          :
          <label htmlFor="editfile" className="shareOption">
          <PermMedia htmlColor="tomato" className="shareIcon" />
          <span className="shareOptionText">Photo or Video</span>
          <input
            style={{ display: "none" }}
            type="file"
            id="editfile"
            accept=".png,.jpeg,.jpg"
            onChange={(e) => setEditFile(e.target.files[0])}
          />
        </label>}
          </> :
          post.img && <img className="postImg" src={`${PF}${post.img}`} alt="" ref={image} onError={(e)=>{ e.target.src = "/assets/post/1.jpeg"; }} />
          }
        </div>
        <div className="postBottom">
          <div className="postBottomLeft">
            <img
              className="likeIcon"
              src={`${PF}like.png`}
              onClick={likeHandler}
              alt=""
            />
            <img
              className="likeIcon"
              src={`${PF}heart.png`}
              onClick={likeHandler}
              alt=""
            />
            <span className="postLikeCounter">{like} people like it</span>
          </div>
          {/* <div className="postBottomRight">
            <span className="postCommentText">{post.comment || 0} comments</span>
          </div> */}
        </div>
        
        {/* Comment Section */}
        <Comment postId={post._id} onCommentAdded={handleCommentAdded} />
      </div>
    </div>
  );
}
