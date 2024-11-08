import React, { useState, useEffect } from "react";
import axios from "axios";
import '../styles/Profile.css';
import Navbar2 from '../components/Navbar2';

const Profile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [profilePicture, setProfilePicture] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
          console.error("User ID not found in localStorage");
          return;
        }

        // Fetch profile picture
        const pictureResponse = await axios.get(
          `http://localhost:5000/api/users/${userId}/get-profile-picture`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (pictureResponse.data.profilePicture) {
          setProfilePicture(pictureResponse.data.profilePicture);
        }

        // Fetch user details
        const userResponse = await axios.get(
          `http://localhost:5000/api/users/${userId}`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (userResponse.data) {
          setUsername(userResponse.data.username);
          setEmail(userResponse.data.email);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      }
    };

    fetchProfileData();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", selectedFile);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users/upload-profile-picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.profilePicture) {
        setProfilePicture(response.data.profilePicture);
        alert("Profile picture uploaded successfully!");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Error uploading profile picture");
    }
  };

  // Handle profile picture deletion
  const handleDeleteProfilePicture = async () => {
    try {
      await axios.delete("http://localhost:5000/api/profile/delete-profile-picture", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      // Update the profile picture state to remove it from view
      setProfilePicture("");
      alert("Profile picture deleted successfully!");
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      alert("Error deleting profile picture");
    }
  };

  return (
    <div>
    <div className="profile-container">
    <h2 style={{ color: "#333" }}>Your Profile</h2>

    {/* Display user information */}
    <div className="user-info">
    <p style={{ color: "#333" }}><strong>Username:</strong> {username}</p>
    <p style={{ color: "#333" }}><strong>Email:</strong> {email}</p>
    </div>

  
      {/* Display the current profile picture */}
      {profilePicture && (
        <div className="profile-picture">
          <img
            src={`http://localhost:5000/${profilePicture}`}
            alt="Profile"
            className="profile-picture-img"
          />
        </div>
      )}
  
      {/* File input and buttons */}
      <input type="file" onChange={handleFileChange} />
      
      <div className="button-group">
        <button onClick={handleUpload} className="upload-button">
          Upload Profile Picture
        </button>
        {profilePicture && (
          <button onClick={handleDeleteProfilePicture} className="delete-button">
            Delete Profile Picture
          </button>
        )}
      </div>
    </div>
    <Navbar2 />
    </div>
  );  
};

export default Profile;
