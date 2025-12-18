import { useEffect, useState } from "react"
import "./chatOnline.css"
import apiClient from "../../utils/apiClient"
import { getProfileImageUrl } from "../../utils/imageUtils"

export const ChatOnline = ({ onlineUsers, currentId, setCurrentChat }) => {
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!currentId) return;
    
    const getFriends = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/users/friends/${currentId}`);
        setFriends(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetching friends:", error);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    }
    getFriends();
  }, [currentId])

  const handleClick = async (user) => {
    if (!currentId || !user?._id) return;
    
    try {
      // Try to find existing conversation
      const res = await apiClient.get(
        `/conversations/find/${currentId}/${user._id}`
      );
      
      if (res.data && res.data._id) {
        setCurrentChat(res.data);
      } else {
        // Create new conversation if it doesn't exist
        const newConvRes = await apiClient.post("/conversations", {
          senderId: currentId,
          receiverId: user._id
        });
        setCurrentChat(newConvRes.data);
      }
    } catch (err) {
      console.error("Error finding/creating conversation:", err);
      // Try to create conversation if find fails
      try {
        const newConvRes = await apiClient.post("/conversations", {
          senderId: currentId,
          receiverId: user._id
        });
        setCurrentChat(newConvRes.data);
      } catch (createErr) {
        console.error("Error creating conversation:", createErr);
      }
    }
  };

  // Separate friends into online and offline
  const onlineFriends = friends.filter((f) => onlineUsers.includes(f._id));
  const offlineFriends = friends.filter((f) => !onlineUsers.includes(f._id));

  if (loading) {
    return (
      <div className="chatOnline">
        <h3 className="chatOnlineTitle">All Friends</h3>
        <div className="chatOnlineEmpty">
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="chatOnline">
        <h3 className="chatOnlineTitle">All Friends</h3>
        <div className="chatOnlineEmpty">
          <p>No friends yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chatOnline">
      <h3 className="chatOnlineTitle">All Friends ({friends.length})</h3>
      <div className="chatOnlineFriendsContainer">
        {/* Online Friends Section */}
        {onlineFriends.length > 0 && (
          <>
            <div className="friendsSectionHeader">
              <span className="sectionTitle">Online ({onlineFriends.length})</span>
            </div>
            {onlineFriends.map((o) => (
              <div 
                key={o._id} 
                className="chatOnlineFriend online" 
                onClick={() => handleClick(o)}
              >
                <div className="chatOnlineImgContainer">
                  <img  
                    className="chatOnlineImg"
                    src={getProfileImageUrl(o?.profilePicture)}
                    alt={o?.username || "Friend"} 
                    onError={(e) => {
                      e.target.src = getProfileImageUrl("person/noAvatar.png");
                    }}
                  />
                  <div className="chatOnlineBadge"></div>
                </div>
                <span className="chatOnlineName">{o?.username || "Unknown"}</span>
              </div>
            ))}
          </>
        )}

        {/* Offline Friends Section */}
        {offlineFriends.length > 0 && (
          <>
            {onlineFriends.length > 0 && (
              <div className="friendsSectionDivider"></div>
            )}
            <div className="friendsSectionHeader">
              <span className="sectionTitle">Offline ({offlineFriends.length})</span>
            </div>
            {offlineFriends.map((o) => (
              <div 
                key={o._id} 
                className="chatOnlineFriend offline" 
                onClick={() => handleClick(o)}
              >
                <div className="chatOnlineImgContainer">
                  <img  
                    className="chatOnlineImg"
                    src={getProfileImageUrl(o?.profilePicture)}
                    alt={o?.username || "Friend"}
                    onError={(e) => {
                      e.target.src = getProfileImageUrl("person/noAvatar.png");
                    }}
                  />
                  {/* No badge for offline users */}
                </div>
                <span className="chatOnlineName">{o?.username || "Unknown"}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
