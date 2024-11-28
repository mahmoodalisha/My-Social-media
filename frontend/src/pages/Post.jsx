import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Post.css'; 

const Post = () => {
    const [content, setContent] = useState('');
    const [media, setMedia] = useState(null);
    const [userId, setUserId] = useState(null); 
    const [error, setError] = useState(null);

    useEffect(() => {
        const id = localStorage.getItem('userId');
        setUserId(id); 
    }, []);

    const handleMediaChange = (e) => {
        setMedia(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('content', content);
    
        if (media) {
            formData.append('profilePicture', media); 
        }
    
        try {
            const response = await axios.post(
                'http://localhost:5000/api/users/upload-profile-picture',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            console.log('Profile picture uploaded:', response.data);
            alert('Profile picture uploaded successfully!'); // Success message
            setContent('');
            setMedia(null);
            setError(null);
        } catch (error) {
            if (error.response && error.response.data.message) {
                alert(error.response.data.message); 
            } else {
                alert('You can only upload jpg or png type of file');
            }
            setError('Failed to upload profile picture. Please try again.');
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
