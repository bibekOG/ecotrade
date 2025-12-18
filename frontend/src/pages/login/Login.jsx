import { useContext, useRef, useState } from "react";
import "./login.css";
import { loginCall } from "../../apiCalls";
import { AuthContext } from "../../context/AuthContext";
import { CircularProgress } from "@material-ui/core";

export default function Login() {
  const email = useRef();
  const password = useRef();
  const { isFetching, dispatch } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    loginCall(
      { email: email.current.value, password: password.current.value },
      dispatch
    );
  };

  return (
    <div className="login">
      <div className="loginWrapper">
        <div className="loginLeft">
          <div className="logoContainer">
            <div className="logoIcon">
              <svg viewBox="0 0 24 24" fill="currentColor" className="logo">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="loginLogo">EcoTrade</h3>
            <div className="logoSubtitle">Your Sustainable Trading Hub</div>
            
            
          </div>
          
          <div className="heroSection">
            <div className="heroIllustration">
              <svg viewBox="0 0 400 300" className="heroSvg">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#667eea",stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#764ba2",stopOpacity:1}} />
                  </linearGradient>
                  <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:"#f093fb",stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:"#f5576c",stopOpacity:1}} />
                  </linearGradient>
                </defs>
                
                {/* Floating Elements */}
                <circle cx="80" cy="80" r="20" fill="url(#grad1)" opacity="0.8">
                  <animate attributeName="cy" values="80;60;80" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="320" cy="120" r="15" fill="url(#grad2)" opacity="0.6">
                  <animate attributeName="cy" values="120;100;120" dur="4s" repeatCount="indefinite"/>
                </circle>
                <circle cx="100" cy="220" r="12" fill="url(#grad1)" opacity="0.7">
                  <animate attributeName="cy" values="220;200;220" dur="3.5s" repeatCount="indefinite"/>
                </circle>
                
                {/* Main Community Icon */}
                <g transform="translate(200,150)">
                  <circle cx="0" cy="0" r="60" fill="url(#grad1)" opacity="0.1"/>
                  <circle cx="0" cy="0" r="40" fill="url(#grad1)" opacity="0.2"/>
                  <circle cx="0" cy="0" r="20" fill="url(#grad1)" opacity="0.3"/>
                  
                  {/* People Icons */}
                  <g transform="translate(-30,-20)">
                    <circle cx="0" cy="0" r="8" fill="url(#grad1)"/>
                    <rect x="-3" y="8" width="6" height="12" rx="3" fill="url(#grad1)"/>
                  </g>
                  <g transform="translate(30,-20)">
                    <circle cx="0" cy="0" r="8" fill="url(#grad2)"/>
                    <rect x="-3" y="8" width="6" height="12" rx="3" fill="url(#grad2)"/>
                  </g>
                  <g transform="translate(0,30)">
                    <circle cx="0" cy="0" r="8" fill="url(#grad1)"/>
                    <rect x="-3" y="8" width="6" height="12" rx="3" fill="url(#grad1)"/>
                  </g>
                </g>
              </svg>
            </div>
          
            <div className="heroText">
              
              <div className="featuresList">
                <div className="featureItem">
                  <div className="featureIcon">🌟</div>
                  <span>Personalized Recommendations</span>
                </div>
                <div className="featureItem">
                  <div className="featureIcon">🛍️</div>
                  <span>Marketplace & Trading</span>
                </div>
                <div className="featureItem">
                  <div className="featureIcon">💬</div>
                  <span>Real-time Messaging</span>
                </div>
                <div className="featureItem">
                  <div className="featureIcon">🔒</div>
                  <span>Secure & Private</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="loginRight">
          <div className="loginContainer">
            <div className="loginHeader">
              <h2>Welcome Back!</h2>
              <p>Sign in to continue your journey</p>
            </div>
            
            <form className="loginBox" onSubmit={handleClick}>
              <div className="inputGroup">
                <div className="inputIcon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <input
                  placeholder="Enter your email"
                  type="email"
                  className="loginInput"
                  ref={email}
                  required
                />
              </div>
              
              <div className="inputGroup password">
                <div className="inputIcon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z"/>
                  </svg>
                </div>
                <input
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  className="loginInput"
                  ref={password}
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="togglePassword"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    // Eye off icon
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M12 6c3.31 0 6.31 1.94 8.49 5-.
01.02-.02.03-.03.05l1.27 1.27c.09-.12.18-.25.27-.38.17-.25.17-.58 0-.83C19.88 7.35 16.16 5 12 5c-1.45 0-2.83.3-4.09.83l1.52 1.52C10.2 7.12 11.08 7 12 7zM2.71 3.16l2.09 2.09C3.08 6.52 1.6 8.18.73 9.11c-.17.25-.17.58 0 .83C4.12 14.65 7.84 17 12 17c1.58 0 3.08-.33 4.45-.94l2.39 2.39 1.41-1.41L4.12 1.75 2.71 3.16zM7.62 8.07l1.55 1.55c-.1.25-.17.52-.17.8 0 1.66 1.34 3 3 3 .28 0 .55-.06.8-.17l1.55 1.55c-.73.37-1.55.59-2.42.59-2.76 0-5-2.24-5-5 0-.87.22-1.69.59-2.42z"/>
                    </svg>
                  ) : (
                    // Eye icon
                    <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 13c-3.04 0-5.5-2.46-5.5-5.5S8.96 6.5 12 6.5s5.5 2.46 5.5 5.5-2.46 5.5-5.5 5.5zm0-9A3.5 3.5 0 0012 16a3.5 3.5 0 000-7z"/>
                    </svg>
                  )}
                </button>
              </div>
              
              <div className="loginOptions">
                <label className="rememberMe">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="#" className="forgotPassword">Forgot Password?</a>
              </div>
              
              <button className="loginButton" type="submit" disabled={isFetching}>
                {isFetching ? (
                  <CircularProgress color="white" size="20px" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z"/>
                    </svg>
                  </>
                )}
              </button>
              
              <div className="divider">
                <span>or</span>
              </div>
              
              <button className="loginRegisterButton" type="button">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span>Create New Account</span>
              </button>
            </form>
            
            <div className="loginFooter">
              <p>By signing in, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
