import "./share.css";
import {
  PermMedia,
  Label,
  Room,
  EmojiEmotions,
  Cancel,
} from "@material-ui/icons";
import { useContext, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiClient from "../../utils/apiClient";

export default function Share() {
  const { user } = useContext(AuthContext);
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
  const desc = useRef();
  const [file, setFile] = useState(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Popular tags for suggestions
  const popularTags = [
    "#books", "#reuse", "#tech", "#food", "#travel", "#music", 
    "#art", "#sports", "#fitness", "#fashion", "#beauty", "#gaming",
    "#movies", "#photography", "#nature", "#cooking", "#health", "#education"
  ];

  const addTagToPost = (tag) => {
    const currentValue = desc.current.value;
    const cursorPos = desc.current.selectionStart;
    const textBefore = currentValue.substring(0, cursorPos);
    const textAfter = currentValue.substring(cursorPos);
    
    // Add space before tag if not at beginning and previous char is not space
    const spaceBefore = cursorPos > 0 && !textBefore.endsWith(' ') ? ' ' : '';
    
    desc.current.value = textBefore + spaceBefore + tag + ' ' + textAfter;
    
    // Set cursor position after the tag
    const newCursorPos = cursorPos + spaceBefore.length + tag.length + 1;
    desc.current.setSelectionRange(newCursorPos, newCursorPos);
    desc.current.focus();
    
    setShowTagSuggestions(false);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    const newPost = {
      userId: user._id,
      desc: desc.current.value,
    };
    if (file) {
      const data = new FormData();
      // Keep existing name for backward compatibility on viewer side
      const fileName = Date.now() + file.name;
      data.append("name", fileName);
      data.append("file", file);
      newPost.img = fileName;
      try {
        await apiClient.post("/upload", data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch (err) {}
    }
    try {
      await apiClient.post("/posts", newPost);
      window.location.reload();
    } catch (err) {}
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

  return (
    <div className="share">
      <div className="shareWrapper">
        <div className="shareTop">
          <img
            className="shareProfileImg"
            src={getProfilePictureUrl(user.profilePicture)}
            alt="Profile"
            onError={(e) => {
              e.target.src = `${PF}person/noAvatar.png`;
            }}
          />
          <div className="shareInputContainer">
            <input
              placeholder={"What's in your mind " + user.username + "?"}
              className="shareInput"
              ref={desc}
            />
            {showTagSuggestions && (
              <div className="tagSuggestions">
                <div className="tagSuggestionsHeader">
                  <span>Popular Tags:</span>
                  <button 
                    className="closeTags"
                    onClick={() => setShowTagSuggestions(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="tagList">
                  {popularTags.map((tag, index) => (
                    <button
                      key={index}
                      className="tagSuggestion"
                      onClick={() => addTagToPost(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <hr className="shareHr" />
        {file && (
          <div className="shareImgContainer">
            <img className="shareImg" src={URL.createObjectURL(file)} alt="" />
            <Cancel className="shareCancelImg" onClick={() => setFile(null)} />
          </div>
        )}
        <form className="shareBottom" onSubmit={submitHandler}>
          <div className="shareOptions">
            <label htmlFor="file" className="shareOption">
              <PermMedia htmlColor="tomato" className="shareIcon" />
              <span className="shareOptionText">Photo or Video</span>
              <input
                style={{ display: "none" }}
                type="file"
                id="file"
                accept=".png,.jpeg,.jpg"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </label>
            <div 
              className="shareOption"
              onClick={() => setShowTagSuggestions(!showTagSuggestions)}
            >
              <Label htmlColor="blue" className="shareIcon" />
              <span className="shareOptionText">Add Tags</span>
            </div>
            <div className="shareOption">
              <Room htmlColor="green" className="shareIcon" />
              <span className="shareOptionText">Location</span>
            </div>
            <div className="shareOption">
              <EmojiEmotions htmlColor="goldenrod" className="shareIcon" />
              <span className="shareOptionText">Feelings</span>
            </div>
          </div>
          <button className="shareButton" type="submit">
            Share
          </button>
        </form>
      </div>
    </div>
  );
}

