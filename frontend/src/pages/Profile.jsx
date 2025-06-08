import React, { useState, useEffect } from "react";
import axios from "axios";
import '../styles/Profile.css';
import Activities from '../components/Activities';

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

        
        const pictureResponse = await axios.get(
          `http://localhost:5000/api/users/${userId}/get-profile-picture`,
          {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        console.log("Profile Picture Response:", pictureResponse.data);

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
        console.log("User Details Response:", userResponse.data);

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

  
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  
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
      alert("You can only upload png or jpf type of files");
    }
  };

  
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
  
  <div className="profile-picture">
    {profilePicture ? (
      <img
        src={profilePicture}
        alt="Profile"
        className="profile-picture-img"
      />
    ) : (
      <div className="placeholder-picture">
        <p>No Picture</p>
      </div>
    )}
  </div>

  
  <div className="user-info">
    <h3>{username}</h3>
    <p>
      <strong>Username:</strong> {username}
    </p>
    <p>
      <strong>Email:</strong> {email}
    </p>
  
          
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
      </div>
      <Activities />
    </div>
  );
    
};

export default Profile;
