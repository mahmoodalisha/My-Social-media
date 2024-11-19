import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const UserDetail = () => {
  const { userId } = useParams();
  const [userDetails, setUserDetails] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [friendRequestId, setFriendRequestId] = useState(null);
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

    const fetchPendingFriendRequest = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/friends/${localStorage.getItem("userId")}/pending-requests`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const sentRequest = response.data.find(request => request.toUser._id === userId);
        if (sentRequest) {
          setFriendRequestSent(true);
          setFriendRequestId(sentRequest._id);
        }
      } catch (err) {
        console.error('Error fetching pending requests:', err);
      }
    };

    fetchUserDetails();
    fetchPendingFriendRequest();
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

  const handleWithdrawFriendRequest = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/friends/friend-request/withdraw',
        { fromUserId: localStorage.getItem("userId"), toUserId: userId },
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
    <div>
      <h2>User Details</h2>
      <p>Username: {userDetails.username}</p>
      <p>Email: {userDetails.email}</p>
      
      {friendRequestSent ? (
        <button onClick={handleWithdrawFriendRequest}>Withdraw Friend Request</button>
      ) : (
        <button onClick={handleSendFriendRequest}>Send Friend Request</button>
      )}
    </div>
  );
};

export default UserDetail;
