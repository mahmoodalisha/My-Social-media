const express = require('express');
const { createPost, getPosts, likePost, addComment, likeComment, addReply, getPostWithComments, editComment, deleteComment } = require('../controllers/postController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');



const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });


router.post('/posts', authMiddleware, upload.single('mediaFile'), createPost);
router.get('/posts', authMiddleware, getPosts);
router.post('/posts/like', authMiddleware, likePost);
router.post('/posts/comments', authMiddleware, addComment);
router.post('/posts/comments/like', authMiddleware, likeComment);
router.post('/posts/comments/replies', authMiddleware, addReply);
router.get('/posts/:postId/comments', authMiddleware, getPostWithComments);
router.put('/posts/comments/edit', editComment);
router.delete('/posts/comments/delete', deleteComment);

module.exports = router;
