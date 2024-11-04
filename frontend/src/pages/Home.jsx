import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "../styles/Home.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [userId, setUserId] = useState(null);

  const limit = 10; // Number of posts per page

  const fetchPosts = async () => {
    const token = localStorage.getItem('token'); // Get the token from local storage
    console.log('Retrieved token:', token); // Log the token for debugging

    if (!token || !userId) {
      console.error("Token or userId not found. Please log in again.");
      return;
    }

    try {
      console.log('Fetching posts for userId:', userId, 'Page:', page); // Log userId and page for debugging

      const response = await axios.get(`http://localhost:5000/api/posts`, {
        params: {
          userId, // Send userId as a query parameter
          page,   // Send page number as a query parameter
          limit,  // Send limit as a query parameter
        },
        headers: {
          Authorization: `Bearer ${token}`, // Set the token in the Authorization header
        },
      });

      console.log('Response data:', response.data); // Log the response data for debugging

      const newPosts = response.data;

      // Update posts state
      setPosts((prevPosts) => {
        const updatedPosts = [...prevPosts, ...newPosts];
        console.log('Updated posts:', updatedPosts); // Log the updated posts
        return updatedPosts;
      });

      // Check if there are more posts to load
      if (newPosts.length < limit) {
        console.log('No more posts to load.'); // Log when there are no more posts
        setHasMorePosts(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error.response ? error.response.data : error.message);
    } finally {
      setLoading(false);
      console.log('Loading state set to false.'); // Log when loading is complete
    }
  };

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId); // Set userId from local storage
    }
  }, []);

  useEffect(() => {
    if (userId) {
      setLoading(true); // Set loading state before fetching
      console.log('Initial loading set to true and calling fetchPosts.'); // Log before calling fetchPosts
      fetchPosts();
    }
  }, [userId, page]); // Added userId as a dependency

  const loadMorePosts = () => {
    if (hasMorePosts && !loading) {
      console.log('Loading more posts.'); // Log when loading more posts
      setPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <div className="home">
      <h1>Instagram</h1>
      {loading && <p>Loading...</p>}
      {posts.map((post) => (
        <div key={post._id} className="post">
          <div className="post-user">
            <h3>{post.user.username}</h3>
            {post.user.media && post.user.media.url && (
              <img src={post.user.media.url} alt={post.user.username} />
            )}
          </div>
          <div className="post-content">
            <p>{post.content}</p>
            {post.media && post.media.url && (
  post.media.type === 'photo' ? (
    <img src={`http://localhost:5000/${post.media.url}`} alt="Post media" className="post-media" />
  ) : (
    <video controls className="post-media">
      <source src={`http://localhost:5000/${post.media.url}`} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
)}

</div>
        </div>
      ))}
      {hasMorePosts && (
        <button onClick={loadMorePosts} disabled={loading}>
          Load More Posts
        </button>
      )}
    </div>
  );
};  

export default Home;
