const mongoose = require('mongoose');
const friendRequestsSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
});

const FriendRequests = mongoose.model('FriendRequests', friendRequestsSchema);

module.exports = FriendRequests;
