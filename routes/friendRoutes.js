//routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const { sendFriendRequest, acceptFriendRequest, getFriends, getPendingFriendRequests, withdrawFriendRequest } = require('../controllers/friendController'); 
const authMiddleware = require('../middleware/authMiddleware');

// Send friend request
router.post('/friend-request', authMiddleware, sendFriendRequest);
// Accept friend request
router.post('/friend-request/accept', authMiddleware, acceptFriendRequest);
// Get friends list for a user
router.get('/:userId/friends', authMiddleware, getFriends);
// Fetch pending friend requests for a user
router.get('/:userId/pending-requests', authMiddleware, getPendingFriendRequests);
// Withdraw a friend request
router.post('/friend-request/withdraw', authMiddleware, withdrawFriendRequest);


module.exports = router;
