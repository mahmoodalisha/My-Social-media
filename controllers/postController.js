//controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

// 1. Create a Post
const createPost = async (req, res) => {
  const { user, content, media } = req.body;
  const userId = user.userId;

  try {
    const userRecord = await User.findById(userId);
    if (!userRecord) return res.status(404).json({ message: 'User not found' });

    if (userRecord.friends.length === 0) {
      return res.status(403).json({ message: 'You need to have friends to create a post.' });
    }

    const post = new Post({
      postId: uuidv4(),
      userId,
      content,
      media,
      timestamp: Date.now().toString(),
      likes: [],
      comments: [],
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// 2. Get Posts by Friends
const getPosts = async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const posts = await Post.find({ userId: { $in: user.friends } })
      .skip((page - 1) * limit)
      .limit(limit);
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// 3. Get Post with Paginated Comments
const getPostWithComments = async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const paginatedComments = post.comments.slice((page - 1) * limit, page * limit);
    res.status(200).json({ postId: post.postId, comments: paginatedComments });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// 4. Like a Post
const likePost = async (req, res) => {
  const { postId, fromUserId, toUserId } = req.body;

  try {
    const user = await User.findById(fromUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const postOwner = await User.findById(toUserId);
    if (!postOwner || !postOwner.friends.includes(fromUserId)) {
      return res.status(403).json({ message: 'You must be friends with the user to like their post.' });
    }

    const updatedPost = await Post.findOneAndUpdate(
      { postId },
      { $addToSet: { likes: fromUserId } },
      { new: true }
    );

    res.status(200).json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// 5. Add a Comment
const addComment = async (req, res) => {
  const { postId, userId, content } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const postOwner = await User.findById(post.userId);
    if (!postOwner || !postOwner.friends.includes(userId)) {
      return res.status(403).json({ message: 'You must be friends with the user to comment on their post.' });
    }

    const comment = {
      commentId: uuidv4(),
      userId,
      content,
      timestamp: Date.now().toString(),
      likes: [],
      replies: [],
    };
    const updatedPost = await Post.findOneAndUpdate(
      { postId },
      { $push: { comments: comment } },
      { new: true }
    );
    res.status(201).json({ comment, post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// 6. Like a Comment
const likeComment = async (req, res) => {
  const { postId, commentId, userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.find(comment => comment.commentId === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const postOwner = await User.findById(post.userId);
    if (!postOwner || !postOwner.friends.includes(userId)) {
      return res.status(403).json({ message: 'You must be friends with the user to like their comment.' });
    }

    comment.likes = Array.from(new Set([...comment.likes, userId])); // Ensure no duplicate likes

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// 7. Add a Reply
const addReply = async (req, res) => {
  const { postId, commentId, userId, content } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.find(comment => comment.commentId === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const postOwner = await User.findById(post.userId);
    if (!postOwner || !postOwner.friends.includes(userId)) {
      return res.status(403).json({ message: 'You must be friends with the user to reply to their comment.' });
    }

    const reply = {
      replyId: uuidv4(),
      userId,
      content,
      timestamp: Date.now().toString(),
    };
    comment.replies.push(reply);

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

module.exports = {
  createPost,
  getPosts,
  getPostWithComments,
  likePost,
  addComment,
  likeComment,
  addReply,
};
