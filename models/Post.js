//models/Post.js
const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  replyId: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
});

const commentSchema = new mongoose.Schema({
  commentId: { type: String, required: true },
  userId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: String, required: true },
  likes: { type: [String], default: [] },
  replies: { type: [replySchema], default: [] },
});

const postSchema = new mongoose.Schema({
  postId: { type: String },
  userId: { type: String },
  content: { type: String },
  media: {
    type: {
      type: String,
      enum: ['photo', 'video'],
      required: false,
    },
    url: { type: String, required: false },
  },
  timestamp: { type: Date, default: Date.now },
  likes: { type: [String], default: [] },
  comments: { type: [commentSchema], default: [] },
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
