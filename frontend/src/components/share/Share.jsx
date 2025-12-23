import "./share.css";
import {
  PermMedia,
  Label,
  Room,
  EmojiEmotions,
  Cancel,
  Videocam,
} from "@material-ui/icons";
import { useContext, useRef, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import apiClient from "../../utils/apiClient";
import { getProfileImageUrl } from "../../utils/imageUtils";

export default function Share() {
  const { user } = useContext(AuthContext);
  const PF = process.env.REACT_APP_PUBLIC_FOLDER || "http://localhost:8800/images/";
  const desc = useRef();
  const [file, setFile] = useState(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showFeelings, setShowFeelings] = useState(false);

  // Popular tags for suggestions
  const popularTags = [
    "#books", "#reuse", "#tech", "#food", "#travel", "#music",
    "#art", "#sports", "#fitness", "#fashion", "#beauty", "#gaming",
    "#movies", "#photography", "#nature", "#cooking", "#health", "#education"
  ];

  // Feelings list
  const feelings = [
    { name: "Happy", icon: "😃" },
    { name: "Blessed", icon: "😇" },
    { name: "Loved", icon: "🥰" },
    { name: "Sad", icon: "😢" },
    { name: "Excited", icon: "🤩" },
    { name: "Thankful", icon: "🙏" },
    { name: "Crazy", icon: "🤪" },
    { name: "Cool", icon: "😎" },
    { name: "Angry", icon: "😡" },
    { name: "Sick", icon: "🤒" },
    { name: "Tired", icon: "😫" },
    { name: "Eating", icon: "🍴" },
    { name: "Drinking", icon: "🍺" },
    { name: "Traveling", icon: "✈️" },
    { name: "Watching", icon: "📺" },
    { name: "Listening", icon: "🎧" },
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

  const addFeelingToPost = (feeling) => {
    const currentValue = desc.current.value;
    const cursorPos = desc.current.selectionStart;
    const textBefore = currentValue.substring(0, cursorPos);
    const textAfter = currentValue.substring(cursorPos);

    const spaceBefore = cursorPos > 0 && !textBefore.endsWith(' ') ? ' ' : '';
    const feelingText = ` — feeling ${feeling.name} ${feeling.icon}`;

    desc.current.value = textBefore + spaceBefore + feelingText + ' ' + textAfter;

    // Set cursor focus
    const newCursorPos = cursorPos + spaceBefore.length + feelingText.length + 1;
    if (desc.current.setSelectionRange) {
      desc.current.setSelectionRange(newCursorPos, newCursorPos);
    }
    desc.current.focus();

    setShowFeelings(false);
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
      } catch (err) { }
    }
    try {
      await apiClient.post("/posts", newPost);
      window.location.reload();
    } catch (err) { }
  };

  return (
    <div className="share">
      <div className="shareWrapper">
        <div className="shareTop">
          <img
            className="shareProfileImg"
            src={getProfileImageUrl(user.profilePicture)}
            alt="Profile"
            onError={(e) => {
              e.target.src = getProfileImageUrl("person/noAvatar.png");
            }}
          />
          <div className="shareInputContainer">
            <input
              placeholder={"What's on your mind, " + user.username + "?"}
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

            {showFeelings && (
              <div className="tagSuggestions">
                <div className="tagSuggestionsHeader">
                  <span>Feeling/Activity:</span>
                  <button
                    className="closeTags"
                    onClick={() => setShowFeelings(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="tagList">
                  {feelings.map((feeling, index) => (
                    <button
                      key={index}
                      className="tagSuggestion"
                      onClick={() => addFeelingToPost(feeling)}
                    >
                      {feeling.icon} {feeling.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {file && (
          <div className="shareImgContainer">
            <img className="shareImg" src={URL.createObjectURL(file)} alt="" />
            <Cancel className="shareCancelImg" onClick={() => setFile(null)} />
          </div>
        )}

        <hr className="shareHr" />

        <form className="shareBottom" onSubmit={submitHandler}>
          <div className="shareOptions">

            <label htmlFor="file" className="shareOption">
              <PermMedia htmlColor="#45bd62" className="shareIcon" />
              <span className="shareOptionText">Photo/Video</span>
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
              onClick={() => {
                setShowFeelings(!showFeelings);
                setShowTagSuggestions(false); // Close tags if open
              }}
            >
              <EmojiEmotions htmlColor="#f7b928" className="shareIcon" />
              <span className="shareOptionText">Feeling/Activity</span>
            </div>

            <div
              className="shareOption"
              onClick={() => {
                setShowTagSuggestions(!showTagSuggestions);
                setShowFeelings(false); // Close feelings if open
              }}
            >
              <Label htmlColor="#1877f2" className="shareIcon" />
              <span className="shareOptionText">Tag</span>
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
