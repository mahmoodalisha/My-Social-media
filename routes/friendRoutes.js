//routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest, getFriends } = require('../controllers/friendController'); 
const authMiddleware = require('../middleware/authMiddleware');

// Send friend request
router.post('/friend-request', authMiddleware, sendFriendRequest);
// Accept friend request
router.post('/friend-request/accept', authMiddleware, acceptFriendRequest);
// Get friends list for a user
router.get('/:userId/friends', authMiddleware, getFriends);

module.exports = router;
