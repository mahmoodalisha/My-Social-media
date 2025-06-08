const express = require('express');
const { createPost, getPosts, likePost, addComment, likeComment, addReply, getPostWithComments, editComment, deleteComment, addReplyToReply } = require('../controllers/postController');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');


//uploading a file is a common function, make a new file where all the uploads operation will be done
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG images and MP4 videos are allowed!'), false);
    }
    cb(null, true);
  }
});

router.post('/posts', authMiddleware, upload.single('mediaFile'), createPost);
router.get('/posts', authMiddleware, getPosts);
router.post('/posts/like', authMiddleware, likePost);
router.post('/posts/comments', authMiddleware, addComment);
router.post('/posts/comments/like', authMiddleware, likeComment);
router.post('/posts/comments/replies', authMiddleware, addReply);
router.post('/posts/comments/replies/reply-to-reply', authMiddleware, addReplyToReply);
router.get('/posts/:postId/comments', authMiddleware, getPostWithComments);
router.put('/posts/comments/edit', editComment);
router.delete('/posts/comments/delete', deleteComment);

module.exports = router;
