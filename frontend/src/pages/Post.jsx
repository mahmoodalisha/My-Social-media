import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Post = () => {
    const [content, setContent] = useState('');
    const [media, setMedia] = useState(null);
    const [userId, setUserId] = useState(null); // Initialize as null
    const [error, setError] = useState(null);

    useEffect(() => {
        const id = localStorage.getItem('userId'); // Get userId from localStorage
        setUserId(id); // Set userId state
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
        <div>
            <form onSubmit={handleSubmit}>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write something..."
                    required
                />
                <input type="file" accept="image/*,video/*" onChange={handleMediaChange} />
                <button type="submit">Post</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>} {/* Display error message if exists */}
        </div>
    );
};

export default Post;
