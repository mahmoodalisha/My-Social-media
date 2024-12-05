const Friends = require('../models/Friends');
const FriendRequests = require('../models/FriendRequest');
const User = require('../models/User');

// Helper function for validating users and friend requests
const validateUserRequest = async (fromUserId, toUserId) => {
    // Check if the "from" user exists
    const fromUser = await User.findById(fromUserId);
    if (!fromUser) return { success: false, message: 'From user not found' };

    // Check if the "to" user exists
    const toUser = await User.findById(toUserId);
    if (!toUser) return { success: false, message: 'To user not found' };

    // Prevent users from sending friend requests to themselves
    if (fromUserId === toUserId) return { success: false, message: "You cannot send a friend request to yourself" };

    // Prevent users from sending a friend request to someone who is already their friend
    const existingFriendship = await Friends.findOne({
        $or: [
            { user1: fromUserId, user2: toUserId },
            { user1: toUserId, user2: fromUserId }
        ]
    });
    if (existingFriendship) return { success: false, message: 'You are already friends with this user' };

    // Check if a friend request already exists
    const existingRequest = await FriendRequests.findOne({ fromUser: fromUserId, toUser: toUserId });
    if (existingRequest) return { success: false, message: 'Friend request already sent' };

    return { success: true };
};

// Send a friend request
const sendFriendRequest = async (req, res) => {
    const { fromUserId, toUserId } = req.body;

    if (!toUserId) return res.status(400).json({ message: 'To user ID is required' });

    const validation = await validateUserRequest(fromUserId, toUserId);
    if (!validation.success) return res.status(400).json({ message: validation.message });

    try {
        const friendRequest = new FriendRequests({
            fromUser: fromUserId,
            toUser: toUserId,
            status: 'pending'
        });
        await friendRequest.save();

        await User.findByIdAndUpdate(fromUserId, { $push: { friendRequestsSent: friendRequest._id } });
        await User.findByIdAndUpdate(toUserId, { $push: { friendRequestsReceived: friendRequest._id } });

        res.status(200).json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating friend request: ' + error.message });
    }
};

// Fetch pending friend requests for a user
const getPendingFriendRequests = async (req, res) => {
    const { userId } = req.params;
  
    try {
        const pendingRequests = await FriendRequests.find({
            toUser: userId,
            status: 'pending'
        }).populate('fromUser', 'username email profilePicture'); // Populate only the sender's info
  
        // Always return an array (even if empty)
        return res.status(200).json(pendingRequests || []); 
  
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending friend requests: ' + error.message });
    }
  };
  

// Accept a friend request
const acceptFriendRequest = async (req, res) => {
    const { fromUserId, toUserId } = req.body;

    try {
        const friendRequest = await FriendRequests.findOne({ fromUser: fromUserId, toUser: toUserId, status: 'pending' });
        if (!friendRequest) return res.status(404).json({ message: 'Friend request not found' });

        friendRequest.status = 'accepted';
        await friendRequest.save();

        const newFriendship = new Friends({
            user1: fromUserId,
            user2: toUserId
        });
        await newFriendship.save();

        await User.findByIdAndUpdate(fromUserId, { $addToSet: { friends: toUserId } });
        await User.findByIdAndUpdate(toUserId, { $addToSet: { friends: fromUserId } });

        res.status(200).json({ message: 'Friend request accepted and friendship created' });
    } catch (error) {
        res.status(500).json({ message: 'Error processing friend request: ' + error.message });
    }
};

// Withdraw a friend request
const withdrawFriendRequest = async (req, res) => {
    const { fromUserId, toUserId } = req.body;

    try {
        const friendRequest = await FriendRequests.findOne({ fromUser: fromUserId, toUser: toUserId, status: 'pending' });
        if (!friendRequest) return res.status(404).json({ message: 'Friend request not found or already accepted/rejected' });

        await FriendRequests.findByIdAndDelete(friendRequest._id);

        await User.findByIdAndUpdate(fromUserId, { $pull: { friendRequestsSent: friendRequest._id } });
        await User.findByIdAndUpdate(toUserId, { $pull: { friendRequestsReceived: friendRequest._id } });

        res.status(200).json({ message: 'Friend request withdrawn' });
    } catch (error) {
        res.status(500).json({ message: 'Error withdrawing friend request: ' + error.message });
    }
};

// Get all friends of a user
const getFriends = async (req, res) => {
    const { userId } = req.params;

    try {
        const friendships = await Friends.find({
            $or: [{ user1: userId }, { user2: userId }]
        }).populate('user1 user2', 'username email profilePicture');

        const friends = friendships.map(friendship =>
            friendship.user1._id.toString() === userId ? friendship.user2 : friendship.user1
        );

        res.status(200).json(friends);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friends: ' + error.message });
    }
}; 

// Remove a friend
const removeFriend = async (req, res) => {
    const { userId, friendId } = req.body;

    if (!userId || !friendId) {
        return res.status(400).json({ message: 'Both user ID and friend ID are required' });
    }

    try {
        // Check if the user is friends with the specified friend
        const friendship = await Friends.findOne({
            $or: [
                { user1: userId, user2: friendId },
                { user1: friendId, user2: userId }
            ]
        });

        if (!friendship) {
            return res.status(404).json({ message: 'Friendship not found' });
        }

        // Remove the friendship document
        await Friends.findByIdAndDelete(friendship._id);

        // Remove the friend from both users' friends lists
        await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing friend: ' + error.message });
    }
};


module.exports = { sendFriendRequest, acceptFriendRequest, getFriends, getPendingFriendRequests, withdrawFriendRequest, removeFriend };
