// routes/PostRoutes.js
const express = require('express');
const { createPost, getPosts, likePost, addComment, likeComment, addReply, getPostWithComments } = require('../controllers/postController'); 
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.post('/posts',authMiddleware, createPost);
router.get('/posts',authMiddleware, getPosts);
router.post('/posts/like',authMiddleware, likePost);
router.post('/posts/comments',authMiddleware, addComment);
router.post('/posts/comments/like',authMiddleware, likeComment);
router.post('/posts/comments/replies',authMiddleware, addReply);
router.get('/posts/:postId/comments', authMiddleware, getPostWithComments);


module.exports = router;
