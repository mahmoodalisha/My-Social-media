// ResetPassword.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [message, setMessage] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Optionally check if the token is valid here
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setMessage("");

    try {
      const response = await axios.post("http://localhost:5000/api/users/reset-password", { token, newPassword });
      if (response.status === 200) {
        setMessage("Your password has been successfully reset!");
        setTimeout(() => navigate("/login"), 5000); // Redirect to login page after 5 seconds
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setErrorMessage("There was an error resetting your password.");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <h2 className="text-center">Reset Password</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="newPassword">Enter New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              {errorMessage && <div className="text-danger">{errorMessage}</div>}
              {message && <div className="text-success">{message}</div>}
              <button type="submit" className="btn btn-primary mt-3">Reset Password</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;