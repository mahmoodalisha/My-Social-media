import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaHeart, FaPen, FaTrashAlt } from 'react-icons/fa';
import { RiWechatLine } from "react-icons/ri";
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
            setComment(""); 

            // Update comments locally for the specific post Instead of fetching all comments each time a comment is added, locally update the comments for that post right after adding one. This avoids unnecessary API calls and makes the comment section feel more responsive.
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
                [postId]: !prevVisible[postId] 
            }));
        } catch (error) {
            console.error('Error fetching comments:', error.response ? error.response.data : error.message);
        }
    };

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            setUserId(storedUserId);
            console.log('userId from localStorage:', storedUserId);
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



    const handleEditComment = async (postId, commentId) => {
        
        const newContent = prompt("Enter the new content for your comment:");
        if (!newContent) return; 
    
        try {
            
            const userId = localStorage.getItem("userId");
    
            if (!userId) {
                console.error("User ID not found in local storage.");
                return;
            }
    
            
            const response = await axios.put(
                `http://localhost:5000/api/posts/comments/edit`,
                {
                    postId,
                    userId,
                    commentId,
                    newContent,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
    
            if (response.status === 200) {
                console.log(response.data.message);
                
                loadComments(postId); // loadComments refreshes the comments for the post
            } else {
                console.error("Failed to edit the comment:", response.data.message);
            }
        } catch (error) {
            console.error("Error editing comment:", error);
        }
    };
    


    
    const handleDeleteComment = async (postId, commentId) => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
        console.error("Token or userId is missing, user is not authenticated");
        return;
    }

    
    postId = String(postId);
    commentId = String(commentId);

    try {
        console.log('Post ID being sent:', postId);
        console.log('Comment ID being sent:', commentId);
        console.log('User ID being sent:', userId);

        const response = await axios.delete(`http://localhost:5000/api/posts/comments/delete`, {
            data: { postId, userId, commentId },
            
        });

        console.log("Comment deleted:", response.data);
        // Update state to remove the deleted comment
        setComments((prevComments) => ({
            ...prevComments,
            [postId]: prevComments[postId].filter((comment) => comment.commentId !== commentId)
        }));
    } catch (error) {
        console.error('Error deleting comment:', error);
    }
};



const handleAddReply = async (postId, commentId) => {
    const replyContent = prompt("Enter your reply:");
    if (!replyContent) return; // Exit if no content is entered

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
        console.error("Token or userId is missing, user is not authenticated");
        return;
    }

    
    postId = String(postId).trim();
    commentId = String(commentId).trim();

    try {
        console.log("Post ID being sent:", postId);
        console.log("Comment ID being sent:", commentId);
        console.log("User ID being sent:", userId);

        const response = await axios.post(
            `http://localhost:5000/api/posts/comments/replies`,
            {
                postId,
                commentId,
                userId,
                content: replyContent,
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        console.log("Reply added successfully:", response.data);
        // Update state to include the new reply
        setComments((prevComments) => ({
            ...prevComments,
            [postId]: prevComments[postId].map((comment) =>
                comment.commentId === commentId
                    ? { ...comment, replies: response.data.replies }
                    : comment
            ),
        }));
    } catch (error) {
        console.error("Error adding reply:", error.response ? error.response.data : error.message);
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
                        <div className="post-user-info">
                            {post.user.profilePicture && (
                                <img 
                                    src={`http://localhost:5000/${post.user.profilePicture}`} 
                                    alt={post.user.username} 
                                    className="profile-picture" 
                                />
                            )}
                            <h3>{post.user.username}</h3>
                        </div>
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
                        <div className="action-button">
                            <button onClick={() => toggleLike(post._id)} className="like-button">
                                <FaHeart color={userLikesPost ? 'red' : 'grey'} size={24} />
                            </button>
                            <span style={{ color: "#333" }}>
                                {post.likesCount || 0} {post.likesCount === 1 ? 'like' : 'likes'}
                            </span>

                            <button onClick={() => setShowCommentInput((prev) => !prev)} className="comment-button">
                                <RiWechatLine size={30} className="comment-icon" />
                                {showCommentInput ? 'Cancel' : 'Add Comment'}
                            </button>
                        </div>

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

                        <button onClick={() => loadComments(post._id)} className="show-comments-button">
                            {visibleComments[post._id] ? 'Hide Comments' : 'Show Comments'}
                        </button>

                        {visibleComments[post._id] && comments[post._id] && Array.isArray(comments[post._id]) && comments[post._id].map((comment) => (
                            <div key={comment.commentId} className="comment">
                                <div className="comment-content">
                                    <div className="comment-header">
                                        {comment.profilePicture ? (
                                            <img 
                                                src={`http://localhost:5000/${comment.profilePicture}`} 
                                                alt={`${comment.username}'s profile`} 
                                                className="profile-picture"
                                            />
                                        ) : (
                                            <div className="profile-placeholder">?</div> 
                                        )}
                                        <strong>{comment.username}</strong>: {comment.content}


                                    </div>

                                    {comment.userId === userId && (
                                        <button 
                                            onClick={() => handleEditComment(post._id, comment.commentId)} 
                                            className="edit-comment-button" 
                                            style={{ marginRight: '2px' }}
                                        >
                                            <FaPen size={15} color="#007bff" />
                                        </button>
                                    )}

                                    {(comment.userId === userId || post.userId === userId) && (
                                        <button onClick={() => handleDeleteComment(post._id, comment.commentId)} className="delete-comment-button">
                                            <FaTrashAlt size={15} color="red" />
                                        </button>
                                    )}
                                </div>

                                {comment.replies && comment.replies.map((reply) => (
  <div key={reply.replyId} className="reply">
    {reply.profilePicture ? (
      <img 
        src={`http://localhost:5000/${reply.profilePicture}`} 
        alt={`${reply.username}'s profile`} 
        className="profile-picture"
      />
    ) : (
      <div className="profile-placeholder">?</div> 
    )}
    <strong>{reply.username}</strong>: {reply.content}
  </div>
))}


                                <button onClick={() => handleAddReply(post._id, comment.commentId)} className="reply-button">
                                    Reply
                                </button>
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