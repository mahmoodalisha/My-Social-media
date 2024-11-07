import React, { useState, useEffect } from "react";
import axios from "axios";
import '../styles/Profile.css';

const Profile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [profilePicture, setProfilePicture] = useState("");
  
  useEffect(() => {
    // Fetch the profile picture when the component mounts
    const fetchProfilePicture = async () => {
      try {
        const userId = localStorage.getItem("userId"); // Get the userId from localStorage
        if (!userId) {
          console.error("User ID not found in localStorage");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/users/${userId}/get-profile-picture`, // Use the userId from localStorage in the URL
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.profilePicture) {
          setProfilePicture(response.data.profilePicture); // Set the profile picture state
        }
      } catch (error) {
        console.error("Error fetching profile picture:", error);
      }
    };

    fetchProfilePicture();
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

      // If the upload is successful, update the profile picture
      if (response.data.profilePicture) {
        setProfilePicture(response.data.profilePicture);
        alert("Profile picture uploaded successfully!");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Error uploading profile picture");
    }
  };

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>

      {/* Display the current profile picture */}
      {profilePicture && (
        <div className="profile-picture">
          <img
            src={`http://localhost:5000/${profilePicture}`} // Display the profile picture from the server
            alt="Profile"
            className="profile-picture-img"
            />

        </div>
      )}

      {/* File input for uploading profile picture */}
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload Profile Picture</button>
    </div>
  );
};

export default Profile;
