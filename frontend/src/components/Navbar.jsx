// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import styles from "../styles/Navbar.module.css"; // Import the CSS module

const Navbar = () => {
  const navigate = useNavigate(); // Hook to programmatically navigate

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear the token from local storage
    navigate("/login"); // Redirect to login page
  };

  return (
    <nav className={styles.navbar}>
      <p>Your Logo</p> {/* You can replace this with your logo or app name */}
      <ul className={styles["nav-menu"]}>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/post">Post</Link>
        </li>
        <li>
          <Link to="/search">Search</Link>
        </li>
        <li>
          <Link to="/profile">Profile</Link>
        </li>
      </ul>
      <div className={styles["nav-login"]}>
        <button onClick={handleLogout}>Logout</button> {/* Logout button with handler */}
      </div>
    </nav>
  );
};

export default Navbar;
