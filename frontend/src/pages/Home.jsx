import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
    const [posts, setPosts] = useState([]);
    const [userId, setUserId] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const fetchUserData = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/user'); // Adjust this URL as needed
            setUserId(response.data.userId); // Assuming userId is in the response
            setPage(response.data.page || 1); // Default to 1 if not provided
            setLimit(response.data.limit || 10); // Default to 10 if not provided
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchPosts = async () => {
        if (userId !== null) { // Only fetch posts if userId is available
            try {
                const response = await axios.get('http://localhost:5000/api/posts', {
                    params: { userId, page, limit }, // Pass params as query parameters
                });
                setPosts(response.data);
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
        }
    };

    useEffect(() => {
        fetchUserData(); // Fetch user data on component mount
    }, []);

    useEffect(() => {
        fetchPosts(); // Fetch posts whenever userId, page, or limit changes
    }, [userId, page, limit]);

    return (
        <div>
            <div>
                {posts.map((post) => (
                    <div key={post.postId}>
                        <h3>{post.user.username}</h3> {/* Assuming username is available */}
                        <p>{post.content}</p>
                        {post.media && post.media.type === 'photo' && (
                            <img src={post.media.url} alt="Post media" />
                        )}
                        {post.media && post.media.type === 'video' && (
                            <video controls>
                                <source src={post.media.url} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )}
                        <hr />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
