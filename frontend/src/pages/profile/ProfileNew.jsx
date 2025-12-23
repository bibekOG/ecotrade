/**
 * Facebook-Style Profile Page
 * Modern profile with cover photo, profile picture, tabs, and content sections
 */

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import { AuthContext } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import Feed from '../../components/feed/Feed';
import Rightbar from '../../components/rightbar/Rightbar';
import './ProfileNew.css';
import { getProfileImageUrl, getCoverImageUrl } from '../../utils/imageUtils';

const ProfileNew = () => {
  const { username } = useParams();
  const history = useHistory();
  const { user: currentUser, dispatch } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [friends, setFriends] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editData, setEditData] = useState({});
  const [followed, setFollowed] = useState(false);

  const coverInputRef = useRef(null);
  const profileInputRef = useRef(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/users?username=${username}`);
        setUser(res.data);
        setEditData({
          fullName: res.data.fullName || '',
          bio: res.data.bio || '',
          location: res.data.location || '',
          website: res.data.website || '',
          contactNumber: res.data.contactNumber || ''
        });
      } catch (err) {
        console.error('Error fetching user:', err);
        history.push('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [username, history]);

  // Check if followed
  useEffect(() => {
    if (user && currentUser) {
      setFollowed(currentUser.followings.includes(user._id));
    }
  }, [user, currentUser]);

  // Fetch friends
  useEffect(() => {
    if (user?._id) {
      const fetchFriends = async () => {
        try {
          const res = await apiClient.get(`/users/friends/${user._id}`);
          setFriends(res.data);
        } catch (err) {
          console.error('Error fetching friends:', err);
        }
      };
      fetchFriends();
    }
  }, [user?._id]);

  // Fetch photos
  useEffect(() => {
    if (user?._id) {
      const fetchPhotos = async () => {
        try {
          const res = await apiClient.get(`/posts/profile/${username}`);
          const postsWithImages = res.data.filter(post => post.img);
          setPhotos(postsWithImages);
        } catch (err) {
          console.error('Error fetching photos:', err);
        }
      };
      fetchPhotos();
    }
  }, [user?._id, username]);

  const isOwnProfile = currentUser?._id === user?._id;

  // Handle cover photo upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingCover(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imagePath = uploadRes.data.filename;

      const updateRes = await apiClient.put(`/users/${user._id}`, {
        userId: currentUser._id,
        coverPicture: imagePath
      });

      setUser(updateRes.data);
      alert('Cover photo updated successfully!');
    } catch (err) {
      console.error('Error uploading cover:', err);
      alert('Failed to upload cover photo');
    } finally {
      setUploadingCover(false);
    }
  };

  // Handle profile picture upload
  const handleProfileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingProfile(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await apiClient.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imagePath = uploadRes.data.filename;

      const updateRes = await apiClient.put(`/users/${user._id}`, {
        userId: currentUser._id,
        profilePicture: imagePath
      });

      setUser(updateRes.data);
      alert('Profile picture updated successfully!');
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert('Failed to upload profile picture');
    } finally {
      setUploadingProfile(false);
    }
  };

  // Handle profile edit save
  const handleSaveProfile = async () => {
    try {
      const updateRes = await apiClient.put(`/users/${user._id}`, {
        userId: currentUser._id,
        ...editData
      });

      setUser(updateRes.data);
      setShowEditProfile(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile');
    }
  };

  // Handle follow/unfollow
  const handleFollow = async () => {
    try {
      if (followed) {
        await apiClient.put(`/users/${user._id}/unfollow`, {
          userId: currentUser._id,
        });
        dispatch({ type: "UNFOLLOW", payload: user._id });
        setFollowed(false);
      } else {
        await apiClient.put(`/users/${user._id}/follow`, {
          userId: currentUser._id,
        });
        dispatch({ type: "FOLLOW", payload: user._id });
        setFollowed(true);
      }
    } catch (err) {
      console.error("Error following/unfollowing user:", err);
    }
  };

  // Handle message click
  const handleMessage = () => {
    history.push(`/messenger?userId=${user._id}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="profile-loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="profile-error">
          <h2>User not found</h2>
        </div>
      </Layout>
    );
  }

  const coverImage = getCoverImageUrl(user.coverPicture);
  const profileImage = getProfileImageUrl(user.profilePicture);

  return (
    <Layout>
      <div className="flex w-full min-h-[calc(100vh-50px)] bg-[#f0f2f5]">
        <div className="profile-page-content  !px-10">
          <div className="profile-new">
            {/* Cover Photo Section */}
            <div className="profile-cover-section">
              <div className="profile-cover-wrapper">
                <img
                  src={coverImage}
                  alt="Cover"
                  className="profile-cover-image"
                />
                {uploadingCover && (
                  <div className="profile-upload-overlay">
                    <div className="spinner"></div>
                    <p>Uploading cover photo...</p>
                  </div>
                )}
                {isOwnProfile && (
                  <>
                    <button
                      className="profile-edit-cover-btn"
                      onClick={() => coverInputRef.current.click()}
                      disabled={uploadingCover}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13h3v-3H4v3zm0-4h3V6H4v3zm5 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm7-5h10v2H16v-2z" />
                      </svg>
                      Edit Cover Photo
                    </button>
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </>
                )}
              </div>

              {/* Profile Header */}
              <div className="profile-header-wrapper">
                <div className="profile-header-content">
                  {/* Profile Picture */}
                  <div className="profile-picture-wrapper">
                    <img
                      src={profileImage}
                      alt={user.username}
                      className="profile-picture"
                    />
                    {uploadingProfile && (
                      <div className="profile-upload-overlay">
                        <div className="spinner"></div>
                      </div>
                    )}
                    {isOwnProfile && (
                      <>
                        <button
                          className="profile-edit-picture-btn"
                          onClick={() => profileInputRef.current.click()}
                          disabled={uploadingProfile}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13h2v-2H4v2zm0-3h2V8H4v2zm4 3c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                          </svg>
                        </button>
                        <input
                          type="file"
                          ref={profileInputRef}
                          onChange={handleProfileUpload}
                          accept="image/*"
                          style={{ display: 'none' }}
                        />
                      </>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="profile-info">
                    <h1 className="profile-name">{user.fullName || user.username}</h1>
                    <p className="profile-username">@{user.username}</p>
                    {user.bio && <p className="profile-bio">{user.bio}</p>}
                    <div className="profile-stats">
                      <div className="profile-stat">
                        <strong>{friends.length}</strong>
                        <span>Friends</span>
                      </div>
                      <div className="profile-stat">
                        <strong>{photos.length}</strong>
                        <span>Photos</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="profile-actions">
                    {isOwnProfile ? (
                      <button
                        className="profile-btn primary"
                        onClick={() => setShowEditProfile(true)}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                        Edit Profile
                      </button>
                    ) : (
                      <>
                        <button
                          className={`profile-btn ${followed ? 'secondary' : 'primary'}`}
                          onClick={handleFollow}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            {followed ? (
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            ) : (
                              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            )}
                          </svg>
                          {followed ? 'Unfriend' : 'Add Friend'}
                        </button>
                        <button
                          className="profile-btn secondary"
                          onClick={handleMessage}
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                          </svg>
                          Message
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="profile-tabs-wrapper">
              <div className="profile-tabs">
                <button
                  className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('posts')}
                >
                  Posts
                </button>
                <button
                  className={`profile-tab ${activeTab === 'about' ? 'active' : ''}`}
                  onClick={() => setActiveTab('about')}
                >
                  About
                </button>
                <button
                  className={`profile-tab ${activeTab === 'friends' ? 'active' : ''}`}
                  onClick={() => setActiveTab('friends')}
                >
                  Friends
                  <span className="tab-count">{friends.length}</span>
                </button>
                <button
                  className={`profile-tab ${activeTab === 'photos' ? 'active' : ''}`}
                  onClick={() => setActiveTab('photos')}
                >
                  Photos
                  <span className="tab-count">{photos.length}</span>
                </button>
              </div>
            </div>

            {/* Content Section */}
            <div className="profile-content">
              <div className="profile-content-container">
                {/* Left Sidebar - About/Intro */}
                <div className="profile-left-sidebar">
                  <div className="profile-intro-card">
                    <h3>Intro</h3>
                    {user.bio && <p className="intro-bio">{user.bio}</p>}
                    <div className="intro-details">
                      {user.location && (
                        <div className="intro-item">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                          </svg>
                          <span>Lives in <strong>{user.location}</strong></span>
                        </div>
                      )}
                      {user.website && (
                        <div className="intro-item">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                          </svg>
                          <a href={user.website} target="_blank" rel="noopener noreferrer">
                            {user.website}
                          </a>
                        </div>
                      )}
                      {user.contactNumber && (
                        <div className="intro-item">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                          </svg>
                          <span>{user.contactNumber}</span>
                        </div>
                      )}
                    </div>
                    {isOwnProfile && (
                      <button
                        className="intro-edit-btn"
                        onClick={() => setShowEditProfile(true)}
                      >
                        Edit Details
                      </button>
                    )}
                  </div>

                  {/* Friends Preview */}
                  {friends.length > 0 && (
                    <div className="profile-friends-card">
                      <div className="card-header">
                        <h3>Friends</h3>
                        <span className="friend-count">{friends.length} friends</span>
                      </div>
                      <div className="friends-grid">
                        {friends.slice(0, 9).map((friend) => (
                          <div
                            key={friend._id}
                            className="friend-item"
                            onClick={() => history.push(`/profile/${friend.username}`)}
                          >
                            <img
                              src={getProfileImageUrl(friend.profilePicture)}
                              alt={friend.username}
                            />
                            <span>{friend.fullName || friend.username}</span>
                          </div>
                        ))}
                      </div>
                      {friends.length > 9 && (
                        <button
                          className="see-all-btn"
                          onClick={() => setActiveTab('friends')}
                        >
                          See All Friends
                        </button>
                      )}
                    </div>
                  )}

                  {/* Photos Preview */}
                  {photos.length > 0 && (
                    <div className="profile-photos-card">
                      <div className="card-header">
                        <h3>Photos</h3>
                        <button
                          className="see-all-link"
                          onClick={() => setActiveTab('photos')}
                        >
                          See All Photos
                        </button>
                      </div>
                      <div className="photos-grid">
                        {photos.slice(0, 9).map((photo) => (
                          <div key={photo._id} className="photo-item">
                            <img src={getProfileImageUrl(photo.img)} alt="" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Content Area */}
                <div className="profile-main-content">
                  {activeTab === 'posts' && (
                    <div className="profile-posts">
                      <Feed username={username} />
                    </div>
                  )}

                  {activeTab === 'about' && (
                    <div className="profile-about">
                      <div className="about-card">
                        <h2>About {user.fullName || user.username}</h2>
                        {user.bio && (
                          <div className="about-section">
                            <h3>Bio</h3>
                            <p>{user.bio}</p>
                          </div>
                        )}
                        <div className="about-section">
                          <h3>Contact Information</h3>
                          <div className="about-details">
                            {user.contactNumber && (
                              <div className="about-item">
                                <strong>Phone:</strong>
                                <span>{user.contactNumber}</span>
                              </div>
                            )}
                            {user.location && (
                              <div className="about-item">
                                <strong>Location:</strong>
                                <span>{user.location}</span>
                              </div>
                            )}
                            {user.website && (
                              <div className="about-item">
                                <strong>Website:</strong>
                                <a href={user.website} target="_blank" rel="noopener noreferrer">
                                  {user.website}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'friends' && (
                    <div className="profile-friends-tab">
                      <div className="friends-tab-card">
                        <h2>Friends ({friends.length})</h2>
                        <div className="friends-list">
                          {friends.map((friend) => (
                            <div
                              key={friend._id}
                              className="friend-card"
                              onClick={() => history.push(`/profile/${friend.username}`)}
                            >
                              <img
                                src={getProfileImageUrl(friend.profilePicture)}
                                alt={friend.username}
                              />
                              <div className="friend-info">
                                <h4>{friend.fullName || friend.username}</h4>
                                <p>@{friend.username}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'photos' && (
                    <div className="profile-photos-tab">
                      <div className="photos-tab-card">
                        <h2>Photos ({photos.length})</h2>
                        <div className="photos-full-grid">
                          {photos.map((photo) => (
                            <div key={photo._id} className="photo-card">
                              <img src={getProfileImageUrl(photo.img)} alt="" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditProfile && (
              <div className="profile-edit-modal">
                <div className="modal-overlay" onClick={() => setShowEditProfile(false)}></div>
                <div className="modal-content">
                  <div className="modal-header">
                    <h2>Edit Profile</h2>
                    <button
                      className="modal-close"
                      onClick={() => setShowEditProfile(false)}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-body">
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={editData.fullName}
                        onChange={(e) =>
                          setEditData({ ...editData, fullName: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) =>
                          setEditData({ ...editData, bio: e.target.value })
                        }
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        value={editData.location}
                        onChange={(e) =>
                          setEditData({ ...editData, location: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Website</label>
                      <input
                        type="text"
                        value={editData.website}
                        onChange={(e) =>
                          setEditData({ ...editData, website: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        value={editData.contactNumber}
                        onChange={(e) =>
                          setEditData({ ...editData, contactNumber: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="modal-btn secondary"
                      onClick={() => setShowEditProfile(false)}
                    >
                      Cancel
                    </button>
                    <button className="modal-btn primary" onClick={handleSaveProfile}>
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Rightbar />
      </div>
    </Layout>
  );
};

export default ProfileNew;
