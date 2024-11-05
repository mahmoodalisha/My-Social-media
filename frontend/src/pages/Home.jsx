import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaHeart } from 'react-icons/fa'; // Importing heart icon from react-icons
import "../styles/Home.css";

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [userId, setUserId] = useState(null);
    const [comment, setComment] = useState(""); // State for the comment input
    const [showCommentInput, setShowCommentInput] = useState(false); // State to toggle comment input
    const limit = 10; // Number of posts per page

    const fetchPosts = async () => {
        const token = localStorage.getItem('token');
        console.log('Retrieved token:', token);

        if (!token || !userId) {
            console.error("Token or userId not found. Please log in again.");
            return;
        }

        try {
            console.log('Fetching posts for userId:', userId, 'Page:', page);
            const response = await axios.get(`http://localhost:5000/api/posts`, {
                params: { userId, page, limit },
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('Response data:', response.data);
            const newPosts = response.data;

            setPosts((prevPosts) => {
                const updatedPosts = [...prevPosts, ...newPosts];
                console.log('Updated posts:', updatedPosts);
                return updatedPosts;
            });

            if (newPosts.length < limit) {
                console.log('No more posts to load.');
                setHasMorePosts(false);
            }
        } catch (error) {
            console.error('Error fetching posts:', error.response ? error.response.data : error.message);
        } finally {
            setLoading(false);
            console.log('Loading state set to false.');
        }
    };

    const toggleLike = async (postId) => {
        const token = localStorage.getItem('token');
        console.log('Toggling like for postId:', postId);
        
        if (!token || !userId) {
            console.error("Token or userId not found. Please log in again.");
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/posts/like`, 
                { postId, fromUserId: userId },  
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Response from like/unlike:', response.data);

            // Update the post's like status in the state
            fetchPosts(); // Re-fetch to get the updated state
        } catch (error) {
            console.error('Error liking/unliking post:', error.response ? error.response.data : error.message);
        }
    };

    const addComment = async (postId) => {
        const token = localStorage.getItem('token');
        console.log('Adding comment for postId:', postId, 'Comment:', comment);
    
        if (!token || !userId) {
            console.error("Token or userId not found. Please log in again.");
            return;
        }
    
        try {
            const response = await axios.post(
                `http://localhost:5000/api/posts/comments`, 
                { postId, userId, content: comment },  
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            console.log('Comment added:', response.data);
            setComment(""); // Clear the comment input after adding
            fetchPosts(); // Re-fetch to get the updated posts with comments
        } catch (error) {
            console.error('Error adding comment:', error.response ? error.response.data : error.message);
        }
    };
    

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
        }
    }, []);

    useEffect(() => {
        if (userId) {
            setLoading(true);
            console.log('Initial loading set to true and calling fetchPosts.');
            fetchPosts();
        }
    }, [userId, page]);

    const loadMorePosts = () => {
        if (hasMorePosts && !loading) {
            console.log('Loading more posts.');
            setPage((prevPage) => prevPage + 1);
        }
    };

    return (
        <div className="home">
            <h1>Instagram</h1>
            {loading && <p>Loading...</p>}
            {posts.map((post) => {
                const userLikesPost = post.likes ? post.likes.includes(userId) : false; // Safely check if likes is defined
                return (
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
                        <div className="post-actions">
                            <button onClick={() => toggleLike(post._id)} className="like-button">
                                <FaHeart
                                    color={userLikesPost ? 'red' : 'grey'} // Change color based on like status
                                    size={24}
                                />
                            </button>
                            <span>{post.likesCount || 0} {post.likesCount === 1 ? 'like' : 'likes'}</span>

                            {/* Comment Button */}
                            <button onClick={() => setShowCommentInput((prev) => !prev)} className="comment-button">
                                {showCommentInput ? 'Cancel' : 'Add Comment'}
                            </button>
                            
                            {/* Comment Input Field */}
                            {showCommentInput && (
                                <div className="comment-input">
                                    <input
                                        type="text"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Type your comment..."
                                    />
                                    <button onClick={() => addComment(post._id)}>Submit</button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {hasMorePosts && (
                <button onClick={loadMorePosts}>Load More</button>
            )}
        </div>
    );
};

export default Home; 
