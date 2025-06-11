import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Navbar2.css";

const Activities = () => {
  const apiBase = process.env.REACT_APP_SERVER_URL;
  const [activeSection, setActiveSection] = useState("Friends");
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!["Friends", "Pending Friend Request"].includes(activeSection)) return;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User is not logged in.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint =
          activeSection === "Friends"
            ? `${apiBase}/api/friends/${userId}/friends`
            : `${apiBase}/api/friends/${userId}/pending-requests`;

        const { data } = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        activeSection === "Friends" ? setFriends(data || []) : setPendingRequests(data || []);
      } catch (err) {
        setError(`Failed to fetch ${activeSection.toLowerCase()}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeSection]);

  const acceptFriendRequest = async (fromUserId) => {
    const toUserId = localStorage.getItem("userId"); 

    if (!toUserId) {
      console.error("Logged-in user ID (toUserId) not found");
      return;
    }

    try {
      const { data } = await axios.post(
        `${apiBase}/api/friends/friend-request/accept`,
        { fromUserId, toUserId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setPendingRequests((prev) => prev.filter((request) => request.fromUser._id !== fromUserId));
      console.log("Friend request accepted:", data);
    } catch (error) {
      console.error("Error accepting friend request:", error.response?.data || error.message);
    }
  };

  const removeFriend = async (friendId) => {
    const userId = localStorage.getItem("userId");

    if (!userId) {
      console.error("Logged-in user ID not found.");
      return;
    }

    try {
      const { data } = await axios.post(
        `${apiBase}/api/friends/remove-friend`,
        { userId, friendId },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setFriends((prev) => prev.filter((friend) => friend._id !== friendId));
      console.log(data.message);
    } catch (error) {
      console.error("Error removing friend:", error.response?.data || error.message);
    }
  };

  const renderContent = () => {
    const contentStyle = { color: "#333", fontSize: "18px", lineHeight: "1.6" };

    if (loading) return <div style={contentStyle}>Loading {activeSection.toLowerCase()}...</div>;
    if (error) return <div style={contentStyle}>{error}</div>;

    if (["Friends", "Pending Friend Request"].includes(activeSection)) {
      const contentList = activeSection === "Friends" ? friends : pendingRequests;
      const title = activeSection === "Friends" ? "Your Friends:" : "Pending Friend Requests:";
      const noDataMessage = activeSection === "Friends" ? "You have no friends." : "No pending friend requests.";

      return (
  <div style={contentStyle}>
    <h3 style={{ fontSize: "20px", color: "#333", marginLeft: "20px" }}>{title}</h3>
    {contentList.length > 0 ? (
      <ul style={{ paddingLeft: "20px" }}>
        {(activeSection === "Pending Friend Request"
          ? contentList.filter((item) => item.fromUser)
          : contentList
        ).map((item) => (
          <li
            key={item._id}
            style={{
              fontSize: "16px",
              color: "#333",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            {activeSection === "Friends" ? (
              <>
                <img
                  src={item.profilePicture}
                  alt={item.username}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    marginRight: "10px",
                  }}
                />
                {item.username}
                <button
                  style={{
                    marginLeft: "auto",
                    padding: "5px 10px",
                    cursor: "pointer",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                  }}
                  onClick={() => removeFriend(item._id)}
                >
                  Remove
                </button>
              </>
            ) : (
              <>
                <img
                  src={item.fromUser.profilePicture}
                  alt={item.fromUser.username}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    marginRight: "10px",
                  }}
                />
                {item.fromUser.username}
                <button
                  style={{
                    marginLeft: "auto",
                    padding: "5px 10px",
                    cursor: "pointer",
                    backgroundColor: "green",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                  }}
                  onClick={() => acceptFriendRequest(item.fromUser._id)}
                >
                  Accept
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    ) : (
      <div style={{ color: "#333" }}>{noDataMessage}</div>
    )}
  </div>
);

    }

    return <div style={contentStyle}>Content for {activeSection} is not available yet.</div>;
  };

  return (
    <div className="navbar2-container">
      <div className="navbar2-box">
        <ul className="nav-menu">
          {["Friends", "Pending Friend Request", "Activity", "Contacts", "Files"].map((item) => (
            <li key={item}>
              <a
                href="#"
                onClick={() => setActiveSection(item)}
                className={activeSection === item ? "active" : ""}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar2-content">{renderContent()}</div>
    </div>
  );
};

export default Activities;
