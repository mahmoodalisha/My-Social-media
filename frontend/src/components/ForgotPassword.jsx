import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css"; 
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");
    try {
      const response = await axios.post("http://localhost:5000/api/users/forgot-password", { email });
      if (response.status === 200) {
        setMessage("Password reset link sent! Check your email.");
        setTimeout(() => navigate("/login"), 10000); 
      }
    } catch (error) {
      console.error("Error sending reset email:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="register-container">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Enter your email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {errorMessage && <div>{errorMessage}</div>}
        {message && <div style={{ color: "green" }}>{message}</div>}
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
};

export default ForgotPassword;
