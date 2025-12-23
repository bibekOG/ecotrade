import apiClient from "../../utils/apiClient";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import "./register.css";

export default function Register() {
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formCallback = new FormData();
      formCallback.append("file", file);
      formCallback.append("name", file.name);

      const res = await apiClient.post("/upload", formCallback);
      if (res.status === 200) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: `/images/${file.name}`,
        }));
      }
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      // Convert comma-separated interests to array
      const interestsArray = formData.interest
        .split(",")
        .map((interest) => interest.trim())
        .filter((interest) => interest.length > 0);

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
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="register">
      <div className="registerWrapper">
        <div className="registerLeft">
          <h3 className="registerLogo">EcoTrade</h3>
          <span className="registerDesc">
            Connect with friends and the world around you on EcoTrade.
          </span>
        </div>
        <div className="registerRight">
          <div className="registerBox">
            <h2 className="registerTitle">Sign Up</h2>
            <p className="registerSubTitle">It's quick and easy.</p>
            <form className="registerForm" onSubmit={handleSubmit}>
              <div className="registerInputRow">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
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

              <div className="registerInputRow">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
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

              <div className="registerInputRow">
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
                <input
                  type="text"
                  name="location"
                  placeholder="Location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />

              </div>

              <input
                type="text"
                name="interest"
                placeholder="Interests (comma separated)"
                value={formData.interest}
                onChange={handleInputChange}
                required
                className="registerInput"
              />

              <div className="registerInputRow">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  className="registerInput"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="registerInput"
                />
              </div>

              <label className="registerUpload">
                <span className="uploadText">{formData.profilePicture ? "Picture Uploaded" : "Upload Profile Picture"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <button className="registerButton" type="submit">
                Sign Up
              </button>

              <button
                className="registerLoginButton"
                type="button"
                onClick={() => history.push("/login")}
              >
                Already have an account?
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
