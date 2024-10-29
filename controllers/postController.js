// controllers/postController.js
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

// 2. Get Posts by Friends and author himself
const getPosts = async (req, res) => {
  const { userId, page = 1, limit = 10 } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Fetch the user's own posts and their friends' posts
    const friendPosts = await Post.find({
      $or: [{ userId: userId }, { userId: { $in: user.friends } }]
    })
      .skip((page - 1) * limit)
      .limit(limit);

    // Map through the posts to format them as required
    const formattedPosts = await Promise.all(friendPosts.map(async (post) => {
      const postUser = await User.findById(post.userId); // Fetch user details for each post

      return {
        media: post.media, // Include media details
        user: {
          type: postUser.media ? postUser.media.type : undefined, // Check if media exists
          url: postUser.media ? postUser.media.url : undefined, // Check if media exists
        },
        _id: post._id,
        postId: post.postId,
        content: post.content,
        timestamp: post.timestamp,
        likes: post.likes, // Include user IDs who liked the post
        comments: await Promise.all(post.comments.map(async (comment) => {
          const commentUser = await User.findById(comment.userId); // Fetch user details for the comment

          return {
            commentId: comment.commentId,
            userId: comment.userId,
            userName: commentUser ? commentUser.username : undefined, // Assuming you have a username field in User model
            content: comment.content,
            timestamp: comment.timestamp,
            likes: comment.likes, // Include user IDs who liked the comment
            replies: await Promise.all(comment.replies.map(async (reply) => {
              const replyUser = await User.findById(reply.userId); // Fetch user details for the reply

              return {
                replyId: reply.replyId,
                userId: reply.userId,
                userName: replyUser ? replyUser.username : undefined, // Assuming you have a username field in User model
                content: reply.content,
                timestamp: reply.timestamp,
                _id: reply._id
              };
            })),
            _id: comment._id
          };
        })),
        __v: post.__v
      };
    }));

    res.status(200).json(formattedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};



// 3. Get Post with Paginated Comments
const getPostWithComments = async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const { userId } = req.body;

  try {
    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const postOwner = await User.findById(post.userId);
    if (!postOwner.friends.includes(userId)) {
      return res.status(403).json({ message: 'You must be friends with the post owner to view comments.' });
    }

    const paginatedComments = post.comments.slice((page - 1) * limit, page * limit);
    res.status(200).json({ postId: post.postId, comments: paginatedComments });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Like a Post
const likePost = async (req, res) => {
  const { postId, fromUserId } = req.body;

  try {
    const user = await User.findById(fromUserId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if the user is the post owner or a friend of the post owner
    const postOwner = await User.findById(post.userId);
    const isPostOwner = postOwner._id.toString() === fromUserId;
    const isFriend = postOwner.friends.includes(fromUserId);

    if (!isPostOwner && !isFriend) {
      return res.status(403).json({ message: 'You must be friends with the post owner to like this post.' });
    }

    post.likes = Array.from(new Set([...post.likes, fromUserId]));
    await post.save();
    res.status(200).json(post);
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
