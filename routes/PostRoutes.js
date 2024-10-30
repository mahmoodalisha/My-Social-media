const express = require('express');
const { createPost, getPosts, likePost, addComment, likeComment, addReply, getPostWithComments } = require('../controllers/postController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to avoid name conflicts
    }
});

const upload = multer({ storage: storage });

// POST route for creating a post with media upload
router.post('/posts', authMiddleware, upload.single('mediaFile'), createPost); // Match the name to 'mediaFile'
router.get('/posts', authMiddleware, getPosts);
router.post('/posts/like', authMiddleware, likePost);
router.post('/posts/comments', authMiddleware, addComment);
router.post('/posts/comments/like', authMiddleware, likeComment);
router.post('/posts/comments/replies', authMiddleware, addReply);
router.get('/posts/:postId/comments', authMiddleware, getPostWithComments);

module.exports = router;
