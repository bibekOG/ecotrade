import React, { useState, useEffect, useContext } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import Layout from "../../components/layout/Layout";
import "./friends.css";

export default function Friends() {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("friends");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
    fetchSentRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/friends/friends/${user._id}`);
      setFriends(res.data);
    } catch (err) {
      console.error("Error fetching friends:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await apiClient.get(`/friends/friend-requests/received/${user._id}`);
      setPendingRequests(res.data);
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await apiClient.get(`/friends/friend-requests/sent/${user._id}`);
      setSentRequests(res.data);
    } catch (err) {
      console.error("Error fetching sent requests:", err);
    }
  };

  const searchUsers = async (query) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await apiClient.get(`/friends/search?q=${query}`);
      // Filter out current user and existing friends
      const filteredResults = res.data.filter(
        (searchUser) => 
          searchUser._id !== user._id && 
          !friends.some(friend => friend._id === searchUser._id) &&
          !pendingRequests.some(req => req.sender._id === searchUser._id) &&
          !sentRequests.some(req => req.receiver._id === searchUser._id)
      );
      setSearchResults(filteredResults);
    } catch (err) {
      console.error("Error searching users:", err);
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      const response = await apiClient.post("/friends/friend-request", {
        senderId: user._id,
        receiverId: receiverId
      });
      
      console.log("Friend request sent successfully:", response.data);
      
      // Remove from search results and add to sent requests
      setSearchResults(prev => prev.filter(u => u._id !== receiverId));
      fetchSentRequests();
      
      alert("Friend request sent successfully! The user will receive a notification.");
    } catch (err) {
      console.error("Error sending friend request:", err);
      const errorMessage = err.response?.data || "Error sending friend request. Please try again.";
      alert(errorMessage);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await apiClient.put(`/friends/friend-request/${requestId}/accept`, {
        userId: user._id
      });
      
      // Refresh all data
      fetchFriends();
      fetchPendingRequests();
      fetchSentRequests();
      
      alert("Friend request accepted!");
    } catch (err) {
      console.error("Error accepting friend request:", err);
      alert("Error accepting friend request. Please try again.");
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      await apiClient.put(`/friends/friend-request/${requestId}/reject`, {
        userId: user._id
      });
      
      fetchPendingRequests();
      alert("Friend request rejected.");
    } catch (err) {
      console.error("Error rejecting friend request:", err);
      alert("Error rejecting friend request. Please try again.");
    }
  };

  const cancelFriendRequest = async (requestId) => {
    try {
      await apiClient.delete(`/friends/friend-request/${requestId}`, {
        data: { userId: user._id }
      });
      
      fetchSentRequests();
      alert("Friend request cancelled.");
    } catch (err) {
      console.error("Error cancelling friend request:", err);
      alert("Error cancelling friend request. Please try again.");
    }
  };

  const removeFriend = async (friendId) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      try {
        await apiClient.delete(`/friends/friends/${user._id}/${friendId}`);
        
        fetchFriends();
        alert("Friend removed successfully.");
      } catch (err) {
        console.error("Error removing friend:", err);
        alert("Error removing friend. Please try again.");
      }
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const handleMessage = (friendId) => {
    // Navigate to messenger with the specific friend
    window.location.href = `/messenger?friend=${friendId}`;
  };

  const handleViewProfile = (username) => {
    window.open(`/profile/${username}`, '_blank');
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading friends...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="friends">
        <div className="friendsWrapper">
          <div className="friendsHeader">
            <h2>Friends</h2>
            <div className="headerActions">
              <button 
                className="searchBtn"
                onClick={() => setShowSearch(!showSearch)}
              >
                {showSearch ? "Hide Search" : "🔍 Search Users"}
              </button>
              <div className="tabButtons">
               
                <button 
                  className={`tabButton ${activeTab === "directory" ? "active" : ""}`}
                  onClick={() => setActiveTab("directory")}
                >
                  My Friends ({friends.length})
                </button>
                <button 
                  className={`tabButton ${activeTab === "pending" ? "active" : ""}`}
                  onClick={() => setActiveTab("pending")}
                >
                  Pending ({pendingRequests.length})
                </button>
                <button 
                  className={`tabButton ${activeTab === "sent" ? "active" : ""}`}
                  onClick={() => setActiveTab("sent")}
                >
                  Sent ({sentRequests.length})
                </button>
              </div>
            </div>
          </div>

          {/* Search Section */}
          {showSearch && (
            <div className="searchSection">
              <div className="searchInput">
                <input
                  type="text"
                  placeholder="Search for users..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              
              {searchResults.length > 0 && (
                <div className="searchResults">
                  <h3>Search Results ({searchResults.length})</h3>
                  <div className="userGrid">
                    {searchResults.map(userResult => (
                      <div key={userResult._id} className="userCard">
                        <img 
                          src={userResult.profilePicture || "/assets/person/noAvatar.png"} 
                          alt="" 
                          className="userImg" 
                        />
                        <div className="userInfo">
                          <h4>{userResult.username}</h4>
                          <p>{userResult.email}</p>
                        </div>
                        <div className="userActions">
                          <button 
                            className="addFriendBtn"
                            onClick={() => sendFriendRequest(userResult._id)}
                          >
                            Add Friend
                          </button>
                          <button 
                            className="viewProfileBtn"
                            onClick={() => handleViewProfile(userResult.username)}
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Friends Directory Tab */}
          {activeTab === "directory" && (
            <div className="directoryTab">
              {friends.length === 0 ? (
                <div className="noFriends">
                  <h3>No Friends Yet</h3>
                  <p>Start by searching for users and sending friend requests!</p>
                  <button 
                    className="searchUsersBtn"
                    onClick={() => setShowSearch(true)}
                  >
                    Search Users
                  </button>
                </div>
              ) : (
                <div className="directoryGrid">
                  {friends.map(friend => (
                    <div key={friend._id} className="directoryCard">
                      <div className="directoryCardHeader">
                        <img 
                          src={friends.profilePicture || "/assets/person/noAvatar.png"} 
                          alt="" 
                          className="directoryImg" 
                        />
                      
                      </div>
                      <div className="directoryCardInfo">
                        <h4>{friend.username}</h4>
                        <p className="friendEmail">{friend.email}</p>
                        <div className="friendStats">
                         
                        </div>
                      </div>
                      <div className="directoryCardActions">
                        <button 
                          className="messageBtn"
                          onClick={() => handleMessage(friend._id)}
                          title="Send Message"
                        >
                          💬
                        </button>
                        <button 
                          className="viewProfileBtn"
                          onClick={() => handleViewProfile(friend.username)}
                          title="View Profile"
                        >
                          👤
                        </button>
                        <button 
                          className="removeFriendBtn"
                          onClick={() => removeFriend(friend._id)}
                          title="Remove Friend"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Friends Tab */}
          {activeTab === "friends" && (
            <div className="friendsTab">
              {friends.length === 0 ? (
                <div className="noFriends">
                  <h3>No Friends Yet</h3>
                  <p>Start by searching for users and sending friend requests!</p>
                  <button 
                    className="searchUsersBtn"
                    onClick={() => setShowSearch(true)}
                  >
                    Search Users
                  </button>
                </div>
              ) : (
                <div className="friendsGrid">
                  {friends.map(friend => (
                    <div key={friend._id} className="friendCard">
                      <img 
                        src={friend.profilePicture || "/assets/person/noAvatar.png"} 
                        alt="" 
                        className="friendImg" 
                      />
                      <div className="friendInfo">
                        <h4>{friend.username}</h4>
                        <p>{friend.email}</p>
                      </div>
                      <div className="friendActions">
                        <button 
                          className="messageBtn"
                          onClick={() => handleMessage(friend._id)}
                        >
                          💬 Message
                        </button>
                        <button 
                          className="viewProfileBtn"
                          onClick={() => handleViewProfile(friend.username)}
                        >
                          👤 Profile
                        </button>
                        <button 
                          className="removeFriendBtn"
                          onClick={() => removeFriend(friend._id)}
                        >
                          ❌ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Requests Tab */}
          {activeTab === "pending" && (
            <div className="pendingTab">
              {pendingRequests.length === 0 ? (
                <div className="noRequests">
                  <h3>No Pending Friend Requests</h3>
                  <p>When someone sends you a friend request, it will appear here.</p>
                </div>
              ) : (
                <div className="requestsGrid">
                  {pendingRequests.map(request => (
                    <div key={request._id} className="requestCard">
                      <img 
                        src={request.sender.profilePicture || "/assets/person/noAvatar.png"} 
                        alt="" 
                        className="requestImg" 
                      />
                      <div className="requestInfo">
                        <h4>{request.sender.username}</h4>
                        <p>{request.sender.email}</p>
                        <p className="requestDate">
                          Sent: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="requestActions">
                        <button 
                          className="acceptBtn"
                          onClick={() => acceptFriendRequest(request._id)}
                        >
                          ✅ Accept
                        </button>
                        <button 
                          className="rejectBtn"
                          onClick={() => rejectFriendRequest(request._id)}
                        >
                          ❌ Reject
                        </button>
                        <button 
                          className="viewProfileBtn"
                          onClick={() => handleViewProfile(request.sender.username)}
                        >
                          👤 Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sent Requests Tab */}
          {activeTab === "sent" && (
            <div className="sentTab">
              {sentRequests.length === 0 ? (
                <div className="noSentRequests">
                  <h3>No Sent Friend Requests</h3>
                  <p>You haven't sent any friend requests yet.</p>
                </div>
              ) : (
                <div className="sentRequestsGrid">
                  {sentRequests.map(request => (
                    <div key={request._id} className="sentRequestCard">
                      <img 
                        src={request.receiver.profilePicture || "/assets/person/noAvatar.png"} 
                        alt="" 
                        className="sentRequestImg" 
                      />
                      <div className="sentRequestInfo">
                        <h4>{request.receiver.username}</h4>
                        <p>{request.receiver.email}</p>
                        <p className="sentRequestDate">
                          Sent: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="sentRequestActions">
                        <button 
                          className="cancelBtn"
                          onClick={() => cancelFriendRequest(request._id)}
                        >
                          ❌ Cancel
                        </button>
                        <button 
                          className="viewProfileBtn"
                          onClick={() => handleViewProfile(request.receiver.username)}
                        >
                          👤 Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
