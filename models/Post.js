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
  comments: { type: [commentSchema], default: [] },
});
const likeSchema = new mongoose.Schema({
  postId: { type: String },
  userId: { type: String },
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);
const Like = mongoose.model('Like', likeSchema);

module.exports = { Post, Like };
