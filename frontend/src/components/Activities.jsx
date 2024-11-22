import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Navbar2.css";

const Activities = () => {
  const [activeSection, setActiveSection] = useState("Friends");
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if the section requires API calls
    if (activeSection !== "Friends" && activeSection !== "Pending Friend Request") {
      return; // Skip fetching for other sections
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("User is not logged in.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint =
          activeSection === "Friends"
            ? `http://localhost:5000/api/friends/${userId}/friends`
            : `http://localhost:5000/api/friends/${userId}/pending-requests`;

        const response = await axios.get(endpoint, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });

        if (activeSection === "Friends") {
          setFriends(response.data || []);
        } else {
          setPendingRequests(response.data || []);
        }
      } catch (err) {
        setError(`Failed to fetch ${activeSection.toLowerCase()}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeSection]);

  const renderContent = () => {
    const contentStyle = { color: "#333", fontSize: "18px", lineHeight: "1.6" };

    if (loading) return <div style={contentStyle}>Loading {activeSection.toLowerCase()}...</div>;
    if (error) return <div style={contentStyle}>{error}</div>;

    if (activeSection === "Friends" || activeSection === "Pending Friend Request") {
      const contentList =
        activeSection === "Friends" ? friends : pendingRequests;
      const title =
        activeSection === "Friends" ? "Your Friends:" : "Pending Friend Requests:";
      const noDataMessage =
        activeSection === "Friends" ? "You have no friends." : "No pending friend requests.";

      const filteredContentList = contentList.filter((item) => {
        if (activeSection === "Friends") {
          return item.username && item.email;
        } else {
          return item.fromUser && item.fromUser.username && item.fromUser.email;
        }
      });

      return (
        <div style={contentStyle}>
          <h3 style={{ fontSize: "20px", color: "#333" }}>{title}</h3>
          {filteredContentList.length > 0 ? (
            <ul style={{ paddingLeft: "20px" }}>
              {filteredContentList.map((item) => (
                <li key={item._id} style={{ fontSize: "16px", color: "#333" }}>
                  {activeSection === "Friends" ? (
                    <>
                      {item.username} - {item.email}
                    </>
                  ) : (
                    <>
                      {item.fromUser.username} - {item.fromUser.email}
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

    // For other sections
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
