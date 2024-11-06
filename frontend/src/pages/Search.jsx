import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Search.css';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [friendRequestsSent, setFriendRequestsSent] = useState({});
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("token");

    if (storedUserId && storedToken) {
      setUserId(storedUserId);
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    const getSentRequests = async () => {
      if (!userId || !token) return;

      try {
        const response = await axios.get(
          `http://localhost:5000/api/friends/sent-requests/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const sentRequests = response.data.reduce((acc, user) => {
          acc[user._id] = true;
          return acc;
        }, {});
        setFriendRequestsSent(sentRequests);
      } catch (err) {
        console.error('Error fetching sent requests:', err);
      }
    };

    getSentRequests();
  }, [userId, token]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term.');
      return;
    }
    try {
      const response = await axios.get(`http://localhost:5000/api/users/search?searchTerm=${searchTerm}`);
      setSearchResults(response.data);
      setError('');
    } catch (err) {
      setError('Error searching for users.');
    }
  };

  const handleSendFriendRequest = async (toUserId) => {
    if (!userId || !token) {
      alert('Please log in first.');
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:5000/api/friends/friend-request',
        { fromUserId: userId, toUserId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setFriendRequestsSent((prev) => ({
          ...prev,
          [toUserId]: true,
        }));
        alert('Friend request sent!');
      } else {
        alert('Error sending friend request.');
      }
    } catch (err) {
      alert('Error sending friend request.');
      console.error(err);
    }
  };

  return (
    <div className="search-container">
      <div className="search-form">
        <h2>Search for Users</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by username or email"
          className="search-input"
        />
        <button className="search-button" onClick={handleSearch}>Search</button>

        {error && <p className="error-message">{error}</p>}

        <ul className="user-list">
          {searchResults.map((user) => (
            <li key={user._id}>
              {user.username} ({user.email})
              {friendRequestsSent[user._id] ? (
                <button disabled>Friend Request Already Sent</button>
              ) : (
                <button onClick={() => handleSendFriendRequest(user._id)}>Send Friend Request</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Search;
