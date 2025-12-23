import React, { useState, useEffect, useContext } from "react";
import apiClient from "../../utils/apiClient";
import { AuthContext } from "../../context/AuthContext";
import Layout from "../../components/layout/Layout";
import Rightbar from "../../components/rightbar/Rightbar";
import { getProfileImageUrl } from "../../utils/imageUtils";
import "./friends.css";

export default function Friends() {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("friends"); // friends, pending, sent, search

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
      setSearchResults(prev => prev.filter(u => u._id !== receiverId));
      fetchSentRequests();
      alert("Friend request sent successfully!");
    } catch (err) {
      console.error("Error sending friend request:", err);
      const errorMessage = err.response?.data || "Error sending friend request.";
      alert(errorMessage);
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await apiClient.put(`/friends/friend-request/${requestId}/accept`, {
        userId: user._id
      });
      fetchFriends();
      fetchPendingRequests();
      fetchSentRequests();
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
    window.location.href = `/messenger?friend=${friendId}`;
  };

  const handleViewProfile = (username) => {
    window.open(`/profile/${username}`, '_blank');
  };

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-50px)] bg-[#f0f2f5]">
        <div className="friendsPageContent">
          <div className="friendsWrapper">

            {/* Header / Tabs - Matching Feed Style */}
            <div className="friendsHeader">
              <h2 className="pageTitle">Friends</h2>
              <div className="filterTabs">
                <button
                  className={`filterTab ${activeTab === "friends" ? "active" : ""}`}
                  onClick={() => setActiveTab("friends")}
                >
                  My Friends
                </button>
                <button
                  className={`filterTab ${activeTab === "pending" ? "active" : ""}`}
                  onClick={() => setActiveTab("pending")}
                >
                  Requests {pendingRequests.length > 0 && <span className="badge">{pendingRequests.length}</span>}
                </button>
                <button
                  className={`filterTab ${activeTab === "sent" ? "active" : ""}`}
                  onClick={() => setActiveTab("sent")}
                >
                  Sent
                </button>
                <button
                  className={`filterTab ${activeTab === "search" ? "active" : ""}`}
                  onClick={() => setActiveTab("search")}
                >
                  Find Friends
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="contentSection">

              {loading && <div className="loadingSpinnerWrapper"><div className="loadingSpinner"></div></div>}

              {/* SEARCH TAB */}
              {activeTab === "search" && (
                <div className="searchContainer !w-full !flex !flex-col fade-in">
                  <div className="searchInputWrapper !w-full">
                    <input
                      type="text"
                      placeholder="Search for people..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="modernInput !px-[20px]"
                      autoFocus
                    />
                  </div>

                  <div className="w-full">

                    {searchResults.length > 0 ? (
                      <div className="gridContainer">
                        {searchResults.map(userResult => (
                          <div key={userResult._id} className="userCard">
                            <img
                              src={getProfileImageUrl(userResult.profilePicture)}
                              alt=""
                              className="cardAvatar"
                              onClick={() => handleViewProfile(userResult.username)}
                            />
                            <div className="cardInfo">
                              <h4 onClick={() => handleViewProfile(userResult.username)}>{userResult.username}</h4>
                              <span className="cardSubtext">{userResult.email}</span>
                            </div>
                            <div className="cardActions">
                              <button
                                className="actionBtn primary-solid"
                                onClick={() => sendFriendRequest(userResult._id)}
                              >
                                Add Friend
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : searchQuery.length > 1 ? (
                      <div className="emptyState">No users found matching "{searchQuery}"</div>
                    ) : (
                      <div className="emptyState">Type a name to search for new friends.</div>
                    )}
                  </div>
                </div>
              )}

              {/* MY FRIENDS TAB */}
              {activeTab === "friends" && (
                <div className="friendsContainer fade-in">
                  {friends.length === 0 ? (
                    <div className="emptyState">
                      <h3>No Friends Yet</h3>
                      <p>Use the "Find Friends" tab to search for people you know.</p>
                      <button className="primaryBtn" onClick={() => setActiveTab("search")}>Find Friends</button>
                    </div>
                  ) : (
                    <div className="gridContainer">
                      {friends.map(friend => (
                        <div key={friend._id} className="userCard">
                          <img
                            src={getProfileImageUrl(friend.profilePicture)}
                            alt=""
                            className="cardAvatar"
                            onClick={() => handleViewProfile(friend.username)}
                          />
                          <div className="cardInfo">
                            <h4 onClick={() => handleViewProfile(friend.username)}>{friend.username}</h4>
                            <span className="cardSubtext">{friend.email}</span>
                          </div>
                          <div className="cardActions">
                            <button
                              className="actionBtn secondary"
                              onClick={() => handleMessage(friend._id)}
                            >
                              Message
                            </button>
                            <button
                              className="actionBtn danger"
                              onClick={() => removeFriend(friend._id)}
                            >
                              Unfriend
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PENDING REQUESTS TAB */}
              {activeTab === "pending" && (
                <div className="requestsContainer fade-in">
                  {pendingRequests.length === 0 ? (
                    <div className="emptyState">
                      <h3>No Pending Requests</h3>
                      <p>Friend requests sent to you will appear here.</p>
                    </div>
                  ) : (
                    <div className="gridContainer">
                      {pendingRequests.map(request => (
                        <div key={request._id} className="userCard">
                          <img
                            src={getProfileImageUrl(request.sender.profilePicture)}
                            alt=""
                            className="cardAvatar"
                            onClick={() => handleViewProfile(request.sender.username)}
                          />
                          <div className="cardInfo">
                            <h4 onClick={() => handleViewProfile(request.sender.username)}>{request.sender.username}</h4>
                            <span className="timeAgo">{new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="cardActions horizontal">
                            <button
                              className="actionBtn primary-solid"
                              onClick={() => acceptFriendRequest(request._id)}
                            >
                              Confirm
                            </button>
                            <button
                              className="actionBtn secondary"
                              onClick={() => rejectFriendRequest(request._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SENT REQUESTS TAB */}
              {activeTab === "sent" && (
                <div className="sentContainer fade-in">
                  {sentRequests.length === 0 ? (
                    <div className="emptyState">
                      <h3>No Sent Requests</h3>
                      <p>Requests you send will track here.</p>
                    </div>
                  ) : (
                    <div className="gridContainer">
                      {sentRequests.map(request => (
                        <div key={request._id} className="userCard">
                          <img
                            src={getProfileImageUrl(request.receiver.profilePicture)}
                            alt=""
                            className="cardAvatar"
                            onClick={() => handleViewProfile(request.receiver.username)}
                          />
                          <div className="cardInfo">
                            <h4 onClick={() => handleViewProfile(request.receiver.username)}>{request.receiver.username}</h4>
                            <span className="timeAgo">Sent on {new Date(request.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="cardActions">
                            <button
                              className="actionBtn secondary"
                              onClick={() => cancelFriendRequest(request._id)}
                            >
                              Cancel Request
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
        </div>
        <Rightbar />
      </div>
    </Layout>
  );
}
