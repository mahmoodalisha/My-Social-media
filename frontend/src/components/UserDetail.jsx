import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const UserDetail = () => {
  const { userId } = useParams();
  const [userDetails, setUserDetails] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const token = localStorage.getItem("token");

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
    fetchUserDetails();
  }, [userId, token]);

  const handleSendFriendRequest = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/friends/friend-request',
        { fromUserId: localStorage.getItem("userId"), toUserId: userId },
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

  if (!userDetails) return <p>Loading user details...</p>;

  return (
    <div>
      <h2>User Details</h2>
      <p>Username: {userDetails.username}</p>
      <p>Email: {userDetails.email}</p>
      <button onClick={handleSendFriendRequest} disabled={friendRequestSent}>
        {friendRequestSent ? 'Friend Request Sent' : 'Send Friend Request'}
      </button>
    </div>
  );
};

export default UserDetail;
