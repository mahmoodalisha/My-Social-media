import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaHeart } from 'react-icons/fa'; 
import "../styles/Home.css";

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [userId, setUserId] = useState(null);
    const [comment, setComment] = useState(""); // State for the comment input
    const [showCommentInput, setShowCommentInput] = useState(false); // State to toggle comment input
    const [comments, setComments] = useState({}); 
    const [visibleComments, setVisibleComments] = useState({}); // visibility of comments for each post
    const limit = 10; 

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

            // Update the like status locally for the post
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post._id === postId
                        ? {
                              ...post,
                              likes: response.data.likes,
                              likesCount: response.data.likesCount,
                          }
                        : post
                )
            );
        } catch (error) {
            console.error('Error liking/unliking post:', error.response ? error.response.data : error.message);
        }
    };

    const addComment = async (postId) => {
        console.log('Post ID being sent:', postId);

        const token = localStorage.getItem('token');
        console.log('Adding comment for postId:', postId, 'Comment:', comment);

        if (!token || !userId) {
            console.error("Token or userId not found. Please log in again.");
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:5000/api/posts/comments`, 
                { postId: String(postId), userId, content: comment }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('Comment added:', response.data);
            setComment(""); // Clear the comment input after adding

            // Update comments locally for the specific post
            setComments((prevComments) => ({
                ...prevComments,
                [postId]: [...(prevComments[postId] || []), response.data.comment],
            }));
        } catch (error) {
            console.error('Error adding comment:', error.response ? error.response.data : error.message);
        }
    };

    const loadComments = async (postId) => {
        const token = localStorage.getItem('token');
        if (!token || !userId) {
            console.error("Token or userId not found. Please log in again.");
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5000/api/posts/${postId}/comments`, {
                params: { userId },
                headers: { Authorization: `Bearer ${token}` }
            });
            setComments((prevComments) => ({
                ...prevComments,
                [postId]: response.data.comments
            }));

            // Toggle visibility of comments
            setVisibleComments((prevVisible) => ({
                ...prevVisible,
                [postId]: !prevVisible[postId] // If already visible, hide; if hidden, show
            }));
        } catch (error) {
            console.error('Error fetching comments:', error.response ? error.response.data : error.message);
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
                const userLikesPost = post.likes ? post.likes.includes(userId) : false;
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
                            <span style={{ color: "#333" }}>
                                {post.likesCount || 0} {post.likesCount === 1 ? 'like' : 'likes'}
                                </span>


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
                            {/* Show/Hide Comments Button */}
                            <button onClick={() => loadComments(post._id)} className="show-comments-button">
                                {visibleComments[post._id] ? 'Hide Comments' : 'Show Comments'}
                            </button>

                            {/* Display Comments */}
                            {visibleComments[post._id] && comments[post._id] && Array.isArray(comments[post._id]) && comments[post._id].map((comment) => (
                                <div key={comment.commentId} className="comment">
                                    <p><strong>{comment.username}</strong>: {comment.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
            {hasMorePosts && (
                <button onClick={loadMorePosts} className="load-more">Load More</button>
            )}
        </div>
    );
};

export default Home;
