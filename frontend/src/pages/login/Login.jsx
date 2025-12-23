import { useContext, useRef, useState } from "react";
import { loginCall } from "../../apiCalls";
import { AuthContext } from "../../context/AuthContext";
import { CircularProgress } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import "./login.css";

export default function Login() {
  const email = useRef();
  const password = useRef();
  const { isFetching, dispatch } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();

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
          <h3 className="loginLogo">EcoTrade</h3>
          <span className="loginDesc">
            Connect with friends and the world around you on EcoTrade.
          </span>
        </div>
        <div className="loginRight">
          <div className="loginBox">
            <form className="loginForm" onSubmit={handleClick}>
              <input
                placeholder="Email or Phone Number"
                type="email"
                required
                className="loginInput"
                ref={email}
              />
              <div className="passwordContainer">
                <input
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength="6"
                  className="loginInput"
                  ref={password}
                />
                <button
                  type="button"
                  className="togglePasswordBtn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button className="loginButton" type="submit" disabled={isFetching}>
                {isFetching ? (
                  <CircularProgress color="inherit" size="20px" />
                ) : (
                  "Log In"
                )}
              </button>
              <span className="loginForgot">Forgot Password?</span>
              <div className="loginDivider"></div>
              <button
                className="loginRegisterButton"
                type="button"
                onClick={() => history.push("/register")}
              >
                Create New Account
              </button>
            </form>
          </div>
          <div className="loginFooter">
            <p><strong>Create a Page</strong> for a celebrity, brand or business.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
