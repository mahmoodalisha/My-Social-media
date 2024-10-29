// controllers/friendController.js
const Friends = require('../models/Friends');
const FriendRequests = require('../models/FriendRequest');
const User = require('../models/User');

// Send a friend request
const sendFriendRequest = async (req, res) => {
    const { fromUserId, toUserId } = req.body;

    // Check if the "from" user exists
    let fromUser;
    try {
        fromUser = await User.findById(fromUserId);
        if (!fromUser) {
            return res.status(404).json({ message: 'From user not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error finding from user: ' + error.message });
    }

    // Check if the "to" user exists
    let toUser;
    try {
        toUser = await User.findById(toUserId);
        if (!toUser) {
            return res.status(404).json({ message: 'To user not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error finding to user: ' + error.message });
    }

    // Check if a friend request already exists
    let existingRequest;
    try {
        existingRequest = await FriendRequests.findOne({ fromUser: fromUserId, toUser: toUserId });
        if (existingRequest) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error checking existing friend request: ' + error.message });
    }

    // Create and save a new friend request
    try {
        const friendRequest = new FriendRequests({
            fromUser: fromUserId,
            toUser: toUserId,
            status: 'pending'
        });
        await friendRequest.save();
        res.status(200).json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating friend request: ' + error.message });
    }
};



const acceptFriendRequest = async (req, res) => {
    const { fromUserId, toUserId } = req.body;

    // Step 1: Check if the friend request exists
    let friendRequest;
    try {
        friendRequest = await FriendRequests.findOne({ fromUser: fromUserId, toUser: toUserId, status: 'pending' });
        if (!friendRequest) {
            return res.status(404).json({ message: 'Friend request not found' });
        }
    } catch (error) {
        return res.status(500).json({ message: 'Error finding friend request: ' + error.message });
    }

    // Step 2: Update the friend request status to accepted
    try {
        friendRequest.status = 'accepted';
        await friendRequest.save();
    } catch (error) {
        return res.status(500).json({ message: 'Error updating friend request status: ' + error.message });
    }

    // Step 3: Add to Friends collection
    try {
        const newFriendship = new Friends({
            user1: fromUserId,
            user2: toUserId
        });
        await newFriendship.save();
    } catch (error) {
        return res.status(500).json({ message: 'Error creating friendship: ' + error.message });
    }

    // Step 4: Update friends array in both users
    try {
        await User.findByIdAndUpdate(fromUserId, { $addToSet: { friends: toUserId } });
        await User.findByIdAndUpdate(toUserId, { $addToSet: { friends: fromUserId } });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating user friends array: ' + error.message });
    }

    res.status(200).json({ message: 'Friend request accepted and friendship created' });
};



const getFriends = async (req, res) => {
    const { userId } = req.params;

    // Step 1: Find friendships where the user is either user1 or user2
    let friendships;
    try {
        friendships = await Friends.find({
            $or: [{ user1: userId }, { user2: userId }]
        }).populate('user1 user2', 'username email');
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching friendships: ' + error.message });
    }

    // Step 2: Extract friend data
    let friends;
    try {
        friends = friendships.map(friendship =>
            friendship.user1._id.toString() === userId ? friendship.user2 : friendship.user1
        );
    } catch (error) {
        return res.status(500).json({ message: 'Error processing friends data: ' + error.message });
    }

    res.status(200).json(friends);
};


module.exports = { sendFriendRequest, acceptFriendRequest, getFriends };
