import React, { useState } from 'react';
import axios from 'axios';

const Post = ({ userId, onPostCreated }) => {
    const [content, setContent] = useState('');
    const [media, setMedia] = useState(null); // Holds file input for photo/video

    const handleMediaChange = (e) => {
        setMedia(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log("User ID:", userId); // Log user ID
        const token = localStorage.getItem('token');
        console.log("Token being sent:", token); // Log token before sending

        const formData = new FormData();
        formData.append('user', JSON.stringify({ userId }));
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
            onPostCreated(response.data);
            setContent('');
            setMedia(null);
        } catch (error) {
            console.error('Error creating post:', error.response ? error.response.data : error.message);
        }
    };

    return (
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
    );
};


export default Post;
