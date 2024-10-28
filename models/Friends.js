// models/Friends.js
const mongoose = require('mongoose');
const friendsSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Friends = mongoose.model('Friends', friendsSchema);

module.exports = Friends;
