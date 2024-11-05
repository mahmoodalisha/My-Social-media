// controllers/postController.js
const { v4: uuidv4 } = require('uuid');
const { Post, Like } = require('../models/Post');
const User = require('../models/User');

// 1. Create a Post with file upload
const createPost = async (req, res) => {
  const { userId, content } = req.body; // Extract userId and content from the body

  try {
    const userRecord = await User.findById(userId);
    if (!userRecord) return res.status(404).json({ message: 'User not found' });

    // Handle the media file
    let media = null;
    if (req.file) {
      const validMimeTypes = ['image/jpeg', 'image/png', 'video/mp4']; // Allowed MIME types
      if (!validMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and MP4 are allowed.' });
      }

      media = {
        type: req.file.mimetype.startsWith('image') ? 'photo' : 'video', // Determine media type
        url: req.file.filename, 
      };
    }

    const post = new Post({
      postId: uuidv4(),
      userId,
      content,
      media,
      timestamp: Date.now(), // Use Date.now() directly
      likes: [],
      comments: [],
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error); // Log the error for debugging
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};


// 2. Get Posts by Friends and author himself
const getPosts = async (req, res) => {
  const { userId } = req.query; // Get userId from query parameters
  const page = parseInt(req.query.page) || 1; // Parse page number
  const limit = parseInt(req.query.limit) || 10; // Parse limit

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch user and friends' posts
    const friendPosts = await Post.find({
      $or: [{ userId: userId }, { userId: { $in: user.friends } }],
    })
      .skip((page - 1) * limit)
      .limit(limit);

    // Format posts
    const formattedPosts = await Promise.all(friendPosts.map(async (post) => {
      const postUser = await User.findById(post.userId);
      const likesCount = await Like.countDocuments({ postId: post._id });

      return {
        media: post.media,
        user: {
          type: postUser.media ? postUser.media.type : undefined,
          url: postUser.media ? postUser.media.url : undefined,
          username: postUser.username, // Ensure username is included
        },
        _id: post._id,
        content: post.content,
        timestamp: post.timestamp,
        likes: post.likes,
        likesCount: likesCount,
        comments: await Promise.all(post.comments.map(async (comment) => {
          const commentUser = await User.findById(comment.userId);

          return {
            commentId: comment.commentId,
            userId: comment.userId,
            userName: commentUser ? commentUser.username : undefined,
            content: comment.content,
            timestamp: comment.timestamp,
            likes: comment.likes,
            replies: await Promise.all(comment.replies.map(async (reply) => {
              const replyUser = await User.findById(reply.userId);

              return {
                replyId: reply.replyId,
                userId: reply.userId,
                userName: replyUser ? replyUser.username : undefined,
                content: reply.content,
                timestamp: reply.timestamp,
                _id: reply._id,
              };
            })),
            _id: comment._id,
          };
        })),
        __v: post.__v,
      };
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// 3. Get Post with Paginated Comments
const getPostWithComments = async (req, res) => {
  const { postId } = req.params; // Get postId from URL parameters
  const { page = 1, limit = 10, userId } = req.query; // Get userId from query parameters, not body

  try {
    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const postOwner = await User.findById(post.userId);
    if (!postOwner) return res.status(404).json({ message: 'Post owner not found' });

    // Check if the user is the post owner or a friend
    const isFriend = postOwner.friends.includes(userId);
    const isOwner = postOwner._id.toString() === userId; // Ensure both are strings for comparison

    if (!isFriend && !isOwner) {
      return res.status(403).json({ message: 'You must be friends with the post owner or the owner themselves to view comments.' });
    }

    const paginatedComments = post.comments.slice((page - 1) * limit, page * limit);
    res.status(200).json({ postId: post.postId, comments: paginatedComments });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

//4.Like a Post
const likePost = async (req, res) => {
  const { postId, fromUserId } = req.body;

  // Validate input
  if (!postId || !fromUserId) {
    return res.status(400).json({ message: 'postId and fromUserId are required' });
  }

  console.log("Received request to like post:", { postId, fromUserId });

  try {
    const user = await User.findById(fromUserId);
    console.log("User found:", user);

    if (!user) {
      console.error(`User not found with ID: ${fromUserId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const post = await Post.findById(postId);
    console.log("Post found:", post);

    if (!post) {
      console.error(`Post not found with ID: ${postId}`);
      return res.status(404).json({ message: 'Post not found' });
    }

    const existingLike = await Like.findOne({ postId, userId: fromUserId });
    console.log("Existing like:", existingLike);

    if (existingLike) {
      // Remove like
      await Like.deleteOne({ postId, userId: fromUserId });

      // Fetch updated likes count
      const updatedLikes = await Like.find({ postId });
      const likesCount = updatedLikes.length;

      return res.status(200).json({ message: 'Like removed', likes: updatedLikes, likesCount });
    } else {
      // Add like
      const newLike = new Like({ postId, userId: fromUserId });
      await newLike.save();

      // Fetch updated likes count
      const updatedLikes = await Like.find({ postId });
      const likesCount = updatedLikes.length;

      return res.status(201).json({ message: 'Post liked', likes: updatedLikes, likesCount });
    }
  } catch (error) {
    console.error("Error in likePost:", error);
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
    
    // Check if the user is the post owner or a friend
    const isFriend = postOwner.friends.includes(userId);
    const isOwner = postOwner._id.toString() === userId; // Ensure we compare strings

    if (!isFriend && !isOwner) {
      return res.status(403).json({ message: 'You must be friends with the post owner or the owner themselves to comment on this post.' });
    }

    const comment = {
      commentId: uuidv4(),
      userId,
      content,
      timestamp: Date.now().toString(),
      likes: [],
      replies: [],
    };

    post.comments.push(comment);
    await post.save();
    res.status(201).json({ comment, post });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Like a Comment
const likeComment = async (req, res) => {
  const { postId, commentId, userId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comment = post.comments.find(comment => comment.commentId === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Check if the user is the post owner or a friend of the post owner
    const postOwner = await User.findById(post.userId);
    const isPostOwner = postOwner._id.toString() === userId;
    const isFriend = postOwner.friends.includes(userId);

    if (!isPostOwner && !isFriend) {
      return res.status(403).json({ message: 'You must be friends with the post owner to like this comment.' });
    }

    comment.likes = Array.from(new Set([...comment.likes, userId]));
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

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
    
    // Check if the user is the post owner, the comment owner, or a friend of the post owner
    const isCommentOwner = comment.userId === userId;
    const isPostOwner = postOwner._id.toString() === userId;
    const isFriend = postOwner.friends.includes(userId);

    if (!isCommentOwner && !isPostOwner && !isFriend) {
      return res.status(403).json({ message: 'You must be friends with the post owner or the comment owner to reply to this comment.' });
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
