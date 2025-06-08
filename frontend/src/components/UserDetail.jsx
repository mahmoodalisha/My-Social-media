import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/UserDetail.css';
import axios from 'axios';

const UserDetail = () => {
  const { userId } = useParams();
  const [userDetails, setUserDetails] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [friendRequestId, setFriendRequestId] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const token = localStorage.getItem("token");
  const isOwnProfile = userId === localStorage.getItem("userId");


  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserDetails(response.data);
      } catch (err) {
        console.error('Error fetching user details:', err);
      }
    };

    

    const fetchSentFriendRequests = async () => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/friends/${localStorage.getItem("userId")}/sent-requests`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const sentRequest = response.data.find(
      (request) => request.toUser._id?.toString().trim() === userId.toString().trim()
    );

    if (sentRequest) {
      setFriendRequestSent(true);
      setFriendRequestId(sentRequest._id);
    } else {
      setFriendRequestSent(false);
      setFriendRequestId(null);
    }
  } catch (err) {
    console.error("Error fetching sent friend requests:", err);
  }
};



    fetchUserDetails();
    fetchSentFriendRequests();
  }, [userId, token]);

  
  useEffect(() => {
    const checkFriendStatus = async () => {
      const currentUserId = localStorage.getItem("userId");
      if (!currentUserId || !token) return;

      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/friends/${currentUserId}/friends`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const friendExists = data.some((friend) => friend._id === userId);
        setIsFriend(friendExists);
      } catch (err) {
        console.error("Error checking friend status", err);
      }
    };

    checkFriendStatus();
  }, [userId, token]);

  
  const handleRemoveFriend = async () => {
    const currentUserId = localStorage.getItem("userId");
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/friends/remove-friend",
        { userId: currentUserId, friendId: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsFriend(false);
      alert(data.message || "Friend removed!");
    } catch (error) {
      console.error("Error removing friend:", error.response?.data || error.message);
      alert("Failed to remove friend.");
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/friends/friend-request',
        { toUserId: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        setFriendRequestSent(true);
        alert('Friend request sent!');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
      alert('Error sending friend request.');
    }
  };

  const handleWithdrawFriendRequest = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/friends/withdraw',
        { toUserId: userId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 200) {
        setFriendRequestSent(false);
        alert('Friend request withdrawn!');
      }
    } catch (err) {
      console.error('Error withdrawing friend request:', err);
      alert('Error withdrawing friend request.');
    }
  };

  if (!userDetails) return <p>Loading user details...</p>;

   return (
  <div className="user-detail-container">
    <h2>User Details</h2>

    <div className="user-detail-info">
      <img
        src={userDetails.profilePicture}
        alt={userDetails.username}
        className="profile-pic"
      />
      <div>
        <p className="username">{userDetails.username}</p>
        
      </div>
    </div>

    {!isOwnProfile && (
  isFriend ? (
    <button className="remove" onClick={handleRemoveFriend}>
      Remove Friend
    </button>
  ) : friendRequestSent ? (
    <button className="withdraw" onClick={handleWithdrawFriendRequest}>
      Withdraw Friend Request
    </button>
  ) : (
    <button className="send" onClick={handleSendFriendRequest}>
      Send Friend Request
    </button>
  )
)}

  </div>
);


};

export default UserDetail;