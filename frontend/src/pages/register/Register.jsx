import apiClient from "../../utils/apiClient";
import { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import {
  AddPhotoAlternate,
  ArrowForward,
  ArrowBack,
  CheckCircle,
  AccountCircle,
  VpnKey,
  Face,
  Email,
  Phone,
  LocationOn,
  Cake,
  ImportContacts,
  Notes,
  Visibility,
  VisibilityOff
} from "@material-ui/icons";

// Move InputField and PasswordField outside component to prevent recreation
const InputField = ({ icon: Icon, error, type = "text", ...props }) => (
  <div className="relative group">
    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${error ? "text-red-500" : "text-gray-400 group-focus-within:text-[#667eea]"
      }`}>
      <Icon fontSize="small" />
    </div>
    <input
      type={type}
      {...props}
      className={`w-full pl-10 pr-10 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 font-medium text-sm ${error
        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
        : "border-gray-200 focus:ring-[#667eea]/30 focus:border-[#667eea] focus:bg-white"
        }`}
    />
    {error && (
      <span className="absolute -bottom-5 left-0 text-xs text-red-500 font-medium">
        {error}
      </span>
    )}
  </div>
);

const PasswordField = ({ icon: Icon, error, showPassword: show, toggleVisibility, ...props }) => (
  <div className="relative group">
    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${error ? "text-red-500" : "text-gray-400 group-focus-within:text-[#667eea]"
      }`}>
      <Icon fontSize="small" />
    </div>
    <input
      type={show ? "text" : "password"}
      {...props}
      className={`w-full pl-10 pr-10 py-3.5 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 font-medium text-sm ${error
        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
        : "border-gray-200 focus:ring-[#667eea]/30 focus:border-[#667eea] focus:bg-white"
        }`}
    />
    <button
      type="button"
      onClick={toggleVisibility}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
    >
      {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
    </button>
    {error && (
      <span className="absolute -bottom-5 left-0 text-xs text-red-500 font-medium">
        {error}
      </span>
    )}
  </div>
);

export default function Register() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const history = useHistory();

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

  const steps = [
    { title: "Account Details", description: "Let's setup your login credentials" },
    { title: "Personal Info", description: "Tell us a bit about yourself" },
    { title: "Profile & Interests", description: "Make your profile stand out" }
  ];

  // Clear errors when step changes
  useEffect(() => {
    setErrors({});
  }, [activeStep]);

  // Use useCallback to memoize the handler
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    setErrors(prev => {
      if (prev[name]) {
        const { [name]: removed, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        profilePicture: "Please upload a valid image (JPEG, PNG, GIF)"
      }));
      return;
    }

    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        profilePicture: "Image size should be less than 5MB"
      }));
      return;
    }

    try {
      setLoading(true);
      const formCallback = new FormData();
      formCallback.append("file", file);
      formCallback.append("name", file.name);

      const res = await apiClient.post("/upload", formCallback);
      if (res.status === 200) {
        setFormData((prev) => ({
          ...prev,
          profilePicture: res.data.url || `/images/${file.name}`,
        }));
        setErrors(prev => {
          const { profilePicture, ...rest } = prev;
          return rest;
        });
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setErrors(prev => ({
        ...prev,
        profilePicture: "Failed to upload image. Please try again."
      }));
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      if (!formData.username.trim()) {
        newErrors.username = "Username is required";
      } else if (formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      }

      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (step === 1) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = "Full name is required";
      }

      if (!formData.contactNumber.trim()) {
        newErrors.contactNumber = "Contact number is required";
      } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.contactNumber)) {
        newErrors.contactNumber = "Please enter a valid phone number";
      }

      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      } else {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13) {
          newErrors.dateOfBirth = "You must be at least 13 years old";
        }
      }

      if (!formData.location.trim()) {
        newErrors.location = "Location is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(activeStep)) return;

    try {
      setLoading(true);
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
      const errorMessage = err.response?.data?.message ||
        "Registration failed. Username or email might already be taken.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white w-full max-w-6xl rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">

        {/* Left Panel - Branding & Benefits */}
        <div className="lg:w-2/5 bg-gradient-to-br from-[#667eea] to-[#764ba2] p-8 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">EcoTrade</h1>
            <p className="opacity-90 font-medium">Sustainable trading community</p>
          </div>

          <div className="relative z-10 space-y-6 my-10">
            <div className="flex items-start space-x-4 animate-fade-in">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Connect Locally</h3>
                <p className="text-sm opacity-80 leading-relaxed">Find eco-conscious traders in your neighborhood instantly.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Secure Trading</h3>
                <p className="text-sm opacity-80 leading-relaxed">Verified profiles and community ratings keep you safe.</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CheckCircle className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Easy Registration</h3>
                <p className="text-sm opacity-80 leading-relaxed">Just {steps.length} simple steps to get started.</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-sm opacity-70">
            <div className="text-center">
              <p>Step {activeStep + 1} of {steps.length}</p>
              <div className="w-full bg-white/20 h-1 rounded-full mt-2">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Steps Form */}
        <div className="lg:w-3/5 p-6 lg:p-12 bg-white flex flex-col">
          {/* Step Progress UI */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 relative">
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${idx <= activeStep
                    ? "bg-[#667eea] text-white shadow-lg shadow-[#667eea]/30 scale-110"
                    : "bg-gray-100 text-gray-500"
                    }`}>
                    {idx + 1}
                  </div>
                  <span className={`text-xs font-semibold mt-2 ${idx <= activeStep ? "text-[#667eea]" : "text-gray-400"} text-center`}>
                    {step.title}
                  </span>
                </div>
              ))}
              {/* Connector Lines */}
              <div className="absolute top-5 left-[20%] right-[20%] h-[2px] bg-gray-100 -z-0">
                <div
                  className="h-full bg-[#667eea] transition-all duration-500 ease-out"
                  style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="text-center mt-6">
              <h2 className="text-2xl font-bold text-gray-800">{steps[activeStep].title}</h2>
              <p className="text-gray-500 text-sm mt-1">{steps[activeStep].description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
            <div className="space-y-5 min-h-[300px]">

              {/* STEP 1: ACCOUNT */}
              {activeStep === 0 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <InputField
                      icon={AccountCircle}
                      type="text"
                      name="username"
                      placeholder="Choose a unique username"
                      value={formData.username}
                      onChange={handleInputChange}
                      error={errors.username}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <InputField
                      icon={Email}
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <PasswordField
                        icon={VpnKey}
                        name="password"
                        placeholder="Min 6 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        error={errors.password}
                        showPassword={showPassword}
                        toggleVisibility={() => setShowPassword(!showPassword)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <PasswordField
                        icon={VpnKey}
                        name="confirmPassword"
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        error={errors.confirmPassword}
                        showPassword={showConfirmPassword}
                        toggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: PERSONAL */}
              {activeStep === 1 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <InputField
                      icon={Face}
                      type="text"
                      name="fullName"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      error={errors.fullName}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <InputField
                        icon={Phone}
                        type="tel"
                        name="contactNumber"
                        placeholder="+1 (555) 123-4567"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        error={errors.contactNumber}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                        Birth Date <span className="text-red-500">*</span>
                      </label>
                      <InputField
                        icon={Cake}
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        error={errors.dateOfBirth}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <InputField
                      icon={LocationOn}
                      type="text"
                      name="location"
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={handleInputChange}
                      error={errors.location}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: PROFILE */}
              {activeStep === 2 && (
                <div className="space-y-5 animate-fade-in-up">
                  {/* Image Upload */}
                  <div className="flex flex-col items-center">
                    <label className="group relative w-32 h-32 cursor-pointer">
                      <div className={`w-full h-full rounded-full overflow-hidden border-4 shadow-xl group-hover:border-[#667eea] transition-all duration-300 bg-gray-50 flex items-center justify-center ${errors.profilePicture ? "border-red-300" : "border-gray-100"
                        }`}>
                        {formData.profilePicture ? (
                          <img
                            src={formData.profilePicture.startsWith("http")
                              ? formData.profilePicture
                              : process.env.REACT_APP_PUBLIC_FOLDER
                                ? process.env.REACT_APP_PUBLIC_FOLDER + formData.profilePicture
                                : "http://localhost:8800/images/" + formData.profilePicture}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/128";
                            }}
                          />
                        ) : (
                          <div className="text-center text-gray-400">
                            <AddPhotoAlternate style={{ fontSize: 40 }} />
                            <span className="block text-[10px] mt-1 font-medium">Upload Photo</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-1 right-1 bg-[#667eea] text-white p-1.5 rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform">
                        <AddPhotoAlternate style={{ fontSize: 16 }} />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    {errors.profilePicture && (
                      <span className="text-xs text-red-500 font-medium mt-2">
                        {errors.profilePicture}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                      Interests (Optional)
                    </label>
                    <InputField
                      icon={ImportContacts}
                      type="text"
                      name="interest"
                      placeholder="e.g., Hiking, Books, Tech (comma separated)"
                      value={formData.interest}
                      onChange={handleInputChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple interests with commas
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide ml-1">
                      Short Bio (Optional)
                    </label>
                    <div className="relative group">
                      <div className="absolute top-3 left-3 pointer-events-none text-gray-400 group-focus-within:text-[#667eea] transition-colors">
                        <Notes fontSize="small" />
                      </div>
                      <textarea
                        name="bio"
                        rows="3"
                        placeholder="Tell us a little about yourself, your trading interests, or anything you'd like others to know..."
                        value={formData.bio}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#667eea]/30 focus:border-[#667eea] focus:bg-white transition-all duration-200 font-medium text-sm resize-none"
                        maxLength={500}
                      />
                      <div className="text-right text-xs text-gray-400 mt-1">
                        {formData.bio.length}/500
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowBack fontSize="small" /> Back
                </button>
              )}

              {activeStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-900 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Next Step <ArrowForward fontSize="small" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold hover:from-[#5a6fd8] hover:to-[#684292] transform hover:-translate-y-0.5 transition-all shadow-lg shadow-[#667eea]/30 hover:shadow-[#667eea]/50 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>Create Account <CheckCircle fontSize="small" /></>
                  )}
                </button>
              )}
            </div>

            <div className="mt-6 text-center">
              <span className="text-gray-500 text-sm">Already have an account? </span>
              <button
                type="button"
                onClick={() => history.push("/login")}
                className="text-[#667eea] font-bold text-sm hover:underline hover:text-[#764ba2] transition-colors"
              >
                Sign In Now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out forwards;
  }
  
  .animate-fade-in {
    animation: fade-in 0.5s ease-out forwards;
  }
  
  input:focus, textarea:focus {
    outline: none;
  }
  
  input:-webkit-autofill,
  input:-webkit-autofill:hover, 
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px white inset;
    box-shadow: 0 0 0px 1000px white inset;
    transition: background-color 5000s ease-in-out 0s;
  }
`;
document.head.appendChild(style);
