import "./profile.css";
import Layout from "../../components/layout/Layout";
import Feed from "../../components/feed/Feed";
import Rightbar from "../../components/rightbar/Rightbar";
import { useEffect, useState, useContext } from "react";
import apiClient from "../../utils/apiClient";
import { useParams, useHistory } from "react-router";
import { AuthContext } from "../../context/AuthContext";
import { Edit, ArrowLeft, Camera, Save, Close } from "@material-ui/icons";
import { getProfileImageUrl, getCoverImageUrl } from "../../utils/imageUtils";

export default function Profile() {
  const [user, setUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const username = useParams().username;
  const history = useHistory();
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/users?username=${username}`);
        if (res.data) {
          setUser(res.data);
          setEditData({
            fullName: res.data.fullName || "",
            bio: res.data.bio || "",
            contactNumber: res.data.contactNumber || "",
            location: res.data.location || "",
            interest: res.data.interest ? res.data.interest.join(", ") : "",
            dateOfBirth: res.data.dateOfBirth ? new Date(res.data.dateOfBirth).toISOString().split('T')[0] : "",
          });
        } else {
          alert("User not found");
          history.goBack();
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        alert("Failed to load user profile. Please try again.");
        history.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username, history]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // File size validation (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    // File type validation
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file");
      return;
    }

    const setUploadingState = type === 'profile' ? setUploading : setUploadingCover;
    setUploadingState(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await apiClient.post("/upload", formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.status === 200) {
        // Use the filename returned from the backend
        const imagePath = res.data.filename; // Just store the filename, not the full path
        
        if (type === 'profile') {
          const response = await apiClient.put(`/users/${user._id}`, {
            userId: currentUser._id,
            profilePicture: imagePath
          });
          setUser(response.data);
          setShowImageUpload(false);
        } else {
          const response = await apiClient.put(`/users/${user._id}`, {
            userId: currentUser._id,
            coverPicture: imagePath
          });
          setUser(response.data);
          setShowCoverUpload(false);
        }
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      if (err.response?.data) {
        alert(`Failed to upload image: ${err.response.data}`);
      } else {
        alert("Failed to upload image. Please try again.");
      }
    } finally {
      setUploadingState(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validation
      if (!editData.fullName.trim()) {
        alert("Full name is required!");
        return;
      }
      
      if (!editData.bio.trim()) {
        alert("Bio is required!");
        return;
      }
      
      if (!editData.contactNumber.trim()) {
        alert("Contact number is required!");
        return;
      }
      
      if (!editData.location.trim()) {
        alert("Location is required!");
        return;
      }
      
      if (!editData.dateOfBirth) {
        alert("Date of birth is required!");
        return;
      }
      
      const interestsArray = editData.interest
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);

      if (interestsArray.length === 0) {
        alert("Please enter at least one interest!");
        return;
      }

      const updateData = {
        userId: currentUser._id,
        fullName: editData.fullName.trim(),
        bio: editData.bio.trim(),
        contactNumber: editData.contactNumber.trim(),
        location: editData.location.trim(),
        interest: interestsArray,
        dateOfBirth: new Date(editData.dateOfBirth).toISOString(),
      };

      const response = await apiClient.put(`/users/${user._id}`, updateData);
      
      // Update local state with the response data
      setUser(response.data);
      
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      if (err.response?.data) {
        alert(`Failed to update profile: ${err.response.data}`);
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      fullName: user.fullName || "",
      bio: user.bio || "",
      contactNumber: user.contactNumber || "",
      location: user.location || "",
      interest: user.interest ? user.interest.join(", ") : "",
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
    });
  };

  const isOwnProfile = currentUser && currentUser.username === username;

  // If not logged in, redirect to login
  if (!currentUser) {
    return (
      <Layout>
        <div className="profile">
          <div className="profileHeader">
            <button className="backButton" onClick={() => history.goBack()}>
              <ArrowLeft />
              Back
            </button>
          </div>
          <div className="profileLoading">
            <p>Please log in to view profiles</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="profile">
        <div className="profileHeader">
          <button className="backButton" onClick={() => history.goBack()}>
            <ArrowLeft />
            Back
          </button>
          {isOwnProfile && (
            <button 
              className="editProfileButton"
              onClick={() => setIsEditing(!isEditing)}
              disabled={saving}
            >
              {isEditing ? <Close /> : <Edit />}
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          )}
        </div>

        {loading ? (
          <div className="profileLoading">
            <div className="loadingSpinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : user && user._id ? (
          <div className="profileRight">
            <div className="profileRightTop">
              <div className="profileCover">
                <img
                  className="profileCoverImg"
                  src={getCoverImageUrl(user.coverPicture)}
                  alt="Cover"
                />
                {isOwnProfile && (
                  <button 
                    className="coverUploadButton"
                    onClick={() => setShowCoverUpload(!showCoverUpload)}
                    disabled={uploadingCover}
                  >
                    <Camera />
                  </button>
                )}
                
                {showCoverUpload && (
                  <div className="imageUploadOverlay">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'cover')}
                      style={{ display: 'none' }}
                      id="coverUpload"
                    />
                    <label htmlFor="coverUpload" className="uploadButton">
                      {uploadingCover ? "Uploading..." : "Change Cover Picture"}
                    </label>
                    <button 
                      className="closeButton"
                      onClick={() => setShowCoverUpload(false)}
                    >
                      <Close />
                    </button>
                  </div>
                )}

                <div 
                  className="profilePictureContainer"
                  onClick={() => isOwnProfile && setShowImageUpload(!showImageUpload)}
                  style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
                >
                  <img
                    className="profileUserImg"
                    src={getProfileImageUrl(user.profilePicture)}
                    alt={user.username || 'Profile'}
                  />
                  {isOwnProfile && (
                    <button 
                      className="profilePictureUploadButton"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowImageUpload(!showImageUpload);
                      }}
                      disabled={uploading}
                      title="Change Profile Picture"
                      aria-label="Change Profile Picture"
                    >
                      <Camera />
                    </button>
                  )}
                </div>

                {showImageUpload && (
                  <div className="imageUploadOverlay profile">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'profile')}
                      style={{ display: 'none' }}
                      id="profileUpload"
                    />
                    <label htmlFor="profileUpload" className="uploadButton">
                      {uploading ? "Uploading..." : "Change Profile Picture"}
                    </label>
                    <button 
                      className="closeButton"
                      onClick={() => setShowImageUpload(false)}
                    >
                      <Close />
                    </button>
                  </div>
                )}
              </div>

              <div className="profileInfo">
                {isEditing ? (
                  <div className="profileEditForm">
                    <div className="formRow">
                      <div className="formGroup">
                        <label>Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={editData.fullName}
                          onChange={handleInputChange}
                          className="editInput"
                          disabled={saving}
                        />
                      </div>
                      <div className="formGroup">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={editData.contactNumber}
                          onChange={handleInputChange}
                          className="editInput"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="formGroup fullWidth">
                      <label>Bio</label>
                      <textarea
                        name="bio"
                        value={editData.bio}
                        onChange={handleInputChange}
                        className="editInput"
                        rows="3"
                        disabled={saving}
                      />
                    </div>

                    <div className="formGroup fullWidth">
                      <label>Interests</label>
                      <input
                        type="text"
                        name="interest"
                        value={editData.interest}
                        onChange={handleInputChange}
                        className="editInput"
                        placeholder="Separate with commas: Reading, Gaming, Sports"
                        disabled={saving}
                      />
                    </div>

                    <div className="formRow">
                      <div className="formGroup">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={editData.dateOfBirth}
                          onChange={handleInputChange}
                          className="editInput"
                          disabled={saving}
                        />
                      </div>
                      <div className="formGroup">
                        <label>Location</label>
                        <input
                          type="text"
                          name="location"
                          value={editData.location}
                          onChange={handleInputChange}
                          className="editInput"
                          placeholder="City, Country"
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="editActions">
                      <button className="saveButton" onClick={handleSave} disabled={saving}>
                        <Save />
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button className="cancelButton" onClick={handleCancel} disabled={saving}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="profileInfoName">{user.fullName || user.username}</h4>
                    <span className="profileInfoUsername">@{user.username}</span>
                    <span className="profileInfoDesc">{user.bio}</span>
                    
                    <div className="profileDetails">
                      <div className="profileDetail">
                        <span className="detailLabel">Contact:</span>
                        <span className="detailValue">{user.contactNumber}</span>
                      </div>
                      <div className="profileDetail">
                        <span className="detailLabel">Location:</span>
                        <span className="detailValue">{user.location}</span>
                      </div>
                      <div className="profileDetail">
                        <span className="detailLabel">Birth Date:</span>
                        <span className="detailValue">
                          {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not specified"}
                        </span>
                      </div>
                      <div className="profileDetail" style={{gridColumn: "1 / -1"}}>
                        <span className="detailLabel">Interests:</span>
                        <div className="interestTags">
                          {user.interest && user.interest.length > 0 
                            ? user.interest.map((interest, index) => (
                                <span key={index} className="interestTag">
                                  {interest}
                                </span>
                              ))
                            : <span className="detailValue">No interests specified</span>}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="profileRightBottom">
              <Feed username={username} />
              <Rightbar user={user} />
            </div>
          </div>
        ) : (
          <div className="profileLoading">
            <p>Profile not found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
