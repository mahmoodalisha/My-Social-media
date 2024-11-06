import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Post.css'; 

const Post = () => {
    const [content, setContent] = useState('');
    const [media, setMedia] = useState(null);
    const [userId, setUserId] = useState(null); // Initialize as null
    const [error, setError] = useState(null);

    useEffect(() => {
        const id = localStorage.getItem('userId'); // Get userId from localStorage
        setUserId(id); 
    }, []);

    const handleMediaChange = (e) => {
        setMedia(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("User ID:", userId); // Log user ID
        const token = localStorage.getItem('token');
        console.log("Token being sent:", token); // Log token before sending

        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('content', content);

        if (media) {
            formData.append('mediaFile', media);
        }

        try {
            const response = await axios.post('http://localhost:5000/api/posts', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
            });
            console.log('Post created:', response.data);
            setContent('');
            setMedia(null);
            setError(null);
        } catch (error) {
            console.error('Error creating post:', error.response ? error.response.data : error.message);
            setError('Failed to create post. Please try again.'); // Update error state
        }
    };

    return (
        <div className="post-container">
            <form onSubmit={handleSubmit} className="post-form">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write something..."
                    required
                    className="post-textarea"
                />
                <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="file-input"
                />
                <button type="submit" className="post-button">Post</button>
            </form>
            {error && <p className="error-message">{error}</p>}
        </div>
    );
};

export default Post;
