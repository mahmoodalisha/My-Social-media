const express = require('express');
const router = express.Router();
const { registerUser, loginUser, searchUsers, getUserById, uploadProfilePicture, deleteProfilePicture, getProfilePicture } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');




const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profile-pictures';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // file size 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/search', searchUsers);
router.get('/:userId', getUserById);
router.post('/upload-profile-picture', authMiddleware, upload.single('profilePicture'), uploadProfilePicture);
router.delete('/delete-profile-picture', authMiddleware, deleteProfilePicture);
router.get('/:userId/get-profile-picture', authMiddleware, getProfilePicture);


module.exports = router;
