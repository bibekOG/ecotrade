import apiClient from "../../utils/apiClient";
import { useState } from "react";
import "./register.css";
import { useHistory } from "react-router";
import { Link } from "react-router-dom";
import { Visibility, VisibilityOff } from "@material-ui/icons";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    email: "",
    contactNumber: "",
    bio: "",
    interest: "",
    dateOfBirth: "",
    location: "",
    password: "",
    confirmPassword: "",
    profilePicture: "",
  });

  const history = useHistory();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", file.name);
      
      const res = await apiClient.post("/upload", formData);
      if (res.status === 200) {
        setFormData(prev => ({
          ...prev,
          profilePicture: `/images/${file.name}`
        }));
      }
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    try {
      // Convert comma-separated interests to array
      const interestsArray = formData.interest
        .split(',')
        .map(interest => interest.trim())
        .filter(interest => interest.length > 0);

      if (interestsArray.length === 0) {
        alert("Please enter at least one interest!");
        return;
      }

      const userData = {
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        bio: formData.bio,
        interest: interestsArray,
        dateOfBirth: new Date(formData.dateOfBirth).toISOString(),
        location: formData.location,
        password: formData.password,
        profilePicture: formData.profilePicture,
      };

      await apiClient.post("/auth/register", userData);
      history.push("/login");
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response?.data) {
        alert(err.response.data);
      } else {
        alert("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="register">
      <div className="registerWrapper">
        <div className="registerLeft">
          <h3 className="registerLogo">EcoTrade</h3>
          <span className="registerDesc">
            Join EcoTrade to connect with friends, trade products, and be part of a sustainable community.
          </span>
        </div>
        <div className="registerRight">
          <form className="registerBox" onSubmit={handleSubmit}>
            <h2 className="registerTitle">Create Account</h2>
            
            <div className="formRow">
              <div className="formGroup">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
              </div>

              <div className="formGroup">
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
              </div>
            </div>

            <div className="formRow">
              <div className="formGroup">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
              </div>

              <div className="formGroup">
                <input
                  type="tel"
                  name="contactNumber"
                  placeholder="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
              </div>
            </div>

            <div className="formGroup fullWidth">
              <textarea
                name="bio"
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={handleInputChange}
                required
                className="registerInput"
                rows="3"
              />
            </div>

            <div className="formGroup fullWidth">
              <input
                type="text"
                name="interest"
                placeholder="Interests (separate with commas: e.g., Reading, Gaming, Sports)"
                value={formData.interest}
                onChange={handleInputChange}
                required
                className="registerInput"
              />
              <small className="formHelpText">
                Separate multiple interests with commas (e.g., Reading, Gaming, Sports)
              </small>
            </div>

            <div className="formRow">
              <div className="formGroup">
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
              </div>

              <div className="formGroup">
                <input
                  type="text"
                  name="location"
                  placeholder="Location (City, Country)"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
              </div>
            </div>

            <div className="formGroup fullWidth">
              <label className="imageUploadLabel">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <span className="uploadButton">
                  {uploading ? "Uploading..." : "Upload Profile Picture"}
                </span>
              </label>
              {formData.profilePicture && (
                <div className="profilePicturePreview">
                  <img src={formData.profilePicture} alt="Profile Preview" />
                </div>
              )}
            </div>

            <div className="formRow">
              <div className="formGroup passwordGroup">
                <div className="passwordInputWrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength="6"
                    className="registerInput"
                  />
                  <button
                    type="button"
                    className="passwordToggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
              </div>

              <div className="formGroup passwordGroup">
                <div className="passwordInputWrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    className="registerInput"
                  />
                  <button
                    type="button"
                    className="passwordToggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </button>
                </div>
              </div>
            </div>

            <button className="registerButton" type="submit">
              Create Account
            </button>
            
            <div className="loginLink">
              Already have an account? 
              <Link to="/login">
                <span className="loginLinkText">Log in here</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

