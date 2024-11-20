const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }], // Store friend IDs
  friendRequestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FriendRequests', default: [] }], // Store received friend requests
  friendRequestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FriendRequests', default: [] }], // Store sent friend requests
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
