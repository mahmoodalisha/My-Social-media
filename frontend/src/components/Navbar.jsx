import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch } from "react-icons/fa"; 
import axios from 'axios';
import styles from "../styles/Navbar.module.css";

const Navbar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [profilePicture, setProfilePicture] = useState("");
  const [username, setUsername] = useState(""); 

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.error("User ID not found in localStorage");
          return;
        }

        // Fetch profile picture
        const profileResponse = await axios.get(
          `http://localhost:5000/api/users/${userId}/get-profile-picture`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (profileResponse.data.profilePicture) {
          setProfilePicture(profileResponse.data.profilePicture);
        }

        // Fetch username
        const userResponse = await axios.get(
          `http://localhost:5000/api/users/${userId}`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (userResponse.data.username) {
          setUsername(userResponse.data.username); 
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchResults([]);
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
        <div className={styles["logo-container"]}>
          {profilePicture ? (
            <img
              src={`http://localhost:5000/${profilePicture}`}
              alt="Profile"
              className={styles["logo-profile-picture"]}
            />
          ) : (
            <p>Your Logo</p>
          )}
          {username && <span className={styles.username}> {username}</span>} 
        </div>
        <ul className={styles["nav-menu"]}>
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/post">Post</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
        <div className={styles["nav-login"]}>
          <div style={{ display: "flex", alignItems: "center", flexGrow: 1, marginTop: "10px" }}> 
          <input
  type="text"
  value={searchTerm}
  onChange={handleSearchChange}
  placeholder="Search users..."
  style={{
    width: "300px", 
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "1rem",
  }}
/>

            <div className={styles["search-icon"]} onClick={handleSearch} style={{ marginLeft: "5px" }}>
              <FaSearch />
            </div>
          </div>
          <button onClick={handleLogout} style={{marginTop:"10px"}}>Logout</button>
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
}
  export default Navbar;
  
