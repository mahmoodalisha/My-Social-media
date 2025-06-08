const express = require('express');
const router = express.Router();
const { registerUser, loginUser, searchUsers, getUserById, uploadProfilePicture, deleteProfilePicture, getProfilePicture, forgotPassword, resetPassword, requestOtp, verifyOtp } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});


router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/search', searchUsers);
router.get('/:userId', getUserById);
router.post(
  '/upload-profile-picture',
  authMiddleware,
  (req, res, next) => {
    upload.single('profilePicture')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: err.message });
      } else if (err) {
        return res.status(400).json({ message: err.message }); // Invalid file type
      }
      next();
    });
  },
  uploadProfilePicture
);

router.delete('/delete-profile-picture', authMiddleware, deleteProfilePicture);
router.get('/:userId/get-profile-picture', authMiddleware, getProfilePicture);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);


module.exports = router;
