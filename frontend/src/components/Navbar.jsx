import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import styles from "../styles/Navbar.module.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchResults([]);  // Clear results when input is empty
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    try {
      const response = await axios.get(`http://localhost:5000/api/users/search?searchTerm=${searchTerm}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching for users:', err);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/user/${userId}`);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <p>Your Logo</p>
        <ul className={styles["nav-menu"]}>
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/post">Post</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
        <div className={styles["nav-login"]}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search users..."
            className={styles["search-input"]}
          />
          <button onClick={handleSearch} className={styles["search-button"]}>Search</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      {searchTerm.trim() && searchResults.length > 0 && (
        <div className={styles["search-results"]}>
          {searchResults.map(user => (
            <p key={user._id} onClick={() => handleUserClick(user._id)}>
              {user.username} ({user.email})
            </p>
          ))}
        </div>
      )}
      {searchTerm.trim() && searchResults.length === 0 && (
        <div className={styles["search-results"]}>
          <p>No users found</p>
        </div>
      )}
    </>
  );
};

export default Navbar;
