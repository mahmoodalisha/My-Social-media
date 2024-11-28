const { v4: uuidv4, validate: uuidValidate } = require('uuid');
const { Post, Like } = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');

// 1. Create a Post with file upload
const createPost = async (req, res) => {
  const { userId, content } = req.body; // Extract userId and content from the body

  try {
    const userRecord = await User.findById(userId);
    if (!userRecord) return res.status(404).json({ message: 'User not found' });

    // Handle the media file
    let media = null;
    if (req.file) {
      const validMimeTypes = ['image/jpeg', 'image/png', 'video/mp4'];
      if (!validMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Invalid file type. Only JPEG, PNG, and MP4 are allowed.' });
      }

      media = {
        type: req.file.mimetype.startsWith('image') ? 'photo' : 'video',
        url: req.file.filename, 
      };
    }

    const post = new Post({
      postId: uuidv4(),
      userId,
      content,
      media,
      timestamp: Date.now(), 
      likes: [],
      comments: [],
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error); 
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
          username: postUser.username,
          profilePicture: postUser.profilePicture, 
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
  const { postId } = req.params; // Extract postId from the URL
  const { page = 1, limit = 10, userId } = req.query; // Pagination and userId from query parameters

  try {
    // Validate the postId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: 'Invalid postId format' });
    }

    // Convert postId to ObjectId for querying
    const objectIdPostId = new mongoose.Types.ObjectId(postId);

    // Find the post by ID
    const post = await Post.findOne({ _id: objectIdPostId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Get post owner details
    const postOwner = await User.findById(post.userId);
    if (!postOwner) {
      return res.status(404).json({ message: 'Post owner not found' });
    }

    // Check access permissions
    if (
      !(postOwner.friends.includes(userId) || postOwner._id.toString() === userId)
    ) {
      return res.status(403).json({
        message: 'You must be friends with the post owner or the owner themselves to view comments.',
      });
    }

    // Utility function to fetch replies recursively
    const mapRepliesWithUsernames = async (replies) => {
      return Promise.all(
        replies.map(async (reply) => {
          const replyUser = await User.findById(reply.userId);
          return {
            replyId: reply.replyId,
            userId: reply.userId,
            username: replyUser ? replyUser.username : 'Unknown',
            profilePicture: replyUser ? replyUser.profilePicture : undefined,
            content: reply.content,
            timestamp: reply.timestamp,
            replies: await mapRepliesWithUsernames(reply.replies || []), // Recursively map nested replies
          };
        })
      );
    };

    // Fetch comments with usernames and their replies
    const commentsWithUsernames = await Promise.all(
      post.comments.map(async (comment) => {
        // Get the username of the commenter
        const user = await User.findById(comment.userId);

        // Fetch replies with usernames recursively
        const repliesWithUsernames = await mapRepliesWithUsernames(comment.replies || []);

        // Return comment with its replies
        return {
          commentId: comment.commentId,
          userId: comment.userId,
          username: user ? user.username : 'Unknown',
          profilePicture: user ? user.profilePicture : undefined,
          content: comment.content,
          timestamp: comment.timestamp,
          likes: comment.likes,
          replies: repliesWithUsernames, // Include nested replies
        };
      })
    );

    // Paginate comments
    const paginatedComments = commentsWithUsernames.slice((page - 1) * limit, page * limit);
    res.status(200).json({ postId: post.postId, comments: paginatedComments });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};





//4.Like a Post
const likePost = async (req, res) => {
  const { postId, fromUserId } = req.body;

  // Validate
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

      
      const updatedLikes = await Like.find({ postId });
      const likesCount = updatedLikes.length;

      return res.status(201).json({ message: 'Post liked', likes: updatedLikes, likesCount });
    }
  } catch (error) {
    console.error("Error in likePost:", error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Helper function to check if a user is authorized
const isUserAuthorized = async (postOwnerId, userId, commentOwnerId = null, requiredRole = 'friendOrOwner') => {
  const postOwner = await User.findById(postOwnerId);
  if (!postOwner) return false;

  const isPostOwner = postOwner._id.toString() === userId;
  const isFriend = postOwner.friends.includes(userId);
  const isCommentOwner = commentOwnerId === userId;

  switch (requiredRole) {
    case 'friendOrOwner':
      return isFriend || isPostOwner;
    case 'friendOwnerOrCommentOwner':
      return isFriend || isPostOwner || isCommentOwner;
    default:
      return false;
  }
};

// Add a Comment
const addComment = async (req, res) => {
  let { postId, userId, content } = req.body;

  console.log('Received postId:', postId);

  // Ensure postId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid postId format' });
  }

  try {
    postId = new mongoose.Types.ObjectId(postId);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const authorized = await isUserAuthorized(post.userId, userId);
    if (!authorized) {
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

  // Validate inputs
  if (!postId || !commentId || !userId) {
    return res.status(400).json({ message: 'postId, commentId, and userId are required' });
  }

  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find the post by `postId` 
    const post = await Post.findOne({ postId });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Find the comment within the post
    const comment = post.comments.find((c) => c.commentId === commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

     
    const authorized = await isUserAuthorized(post.userId, userId);
    if (!authorized) {
      return res.status(403).json({ message: 'You must be friends with the post owner to like this comment.' });
    }

    // Add like if not already liked by this user
    if (!comment.likes.includes(userId)) {
      comment.likes.push(userId);
    } else {
      // Remove like if the user already liked it
      comment.likes = comment.likes.filter((like) => like !== userId);
    }

    
    await post.save();
    res.status(200).json({ message: 'Comment like status updated', likes: comment.likes });
  } catch (error) {
    console.error("Error in likeComment:", error.message);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};



const addReply = async (req, res) => {
  console.log('Received request body:', req.body);

  let { postId, commentId, userId, content } = req.body;

  try {
   
    const post = await Post.findOne({ _id: new mongoose.Types.ObjectId(postId) });
    if (!post) {
      console.log('Post not found for postId:', postId);
      return res.status(404).json({ message: 'Post not found' });
    }

    
    const comment = post.comments.find(c => c.commentId === commentId);
    if (!comment) {
      console.log('Comment not found for commentId:', commentId);
      return res.status(404).json({ message: 'Comment not found' });
    }

    
    const authorized = await isUserAuthorized(post.userId, userId, comment.userId, 'friendOwnerOrCommentOwner');
    if (!authorized) {
      return res.status(403).json({
        message: 'You must be friends with the post owner, the comment owner, or the post owner themselves to reply to this comment.',
      });
    }

    
    const reply = {
      replyId: uuidv4(), 
      userId,
      content,
      timestamp: Date.now().toString(),
    };

    comment.replies.push(reply);

    
    await post.save();
    return res.status(201).json({ message: 'Reply added successfully', replies: comment.replies });

  } catch (error) {
    console.error('Error during addReply:', error.message);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
}; 

//utility function to find a reply by its replyId recursively
const findReplyById = (replies, replyId) => {
  for (let reply of replies) {
    if (reply.replyId === replyId) {
      return reply;
    }
    if (reply.replies && reply.replies.length) {
      const nestedReply = findReplyById(reply.replies, replyId);
      if (nestedReply) return nestedReply;
    }
  }
  return null;
};


const addReplyToReply = async (req, res) => {
  const { postId, replyId, userId, content } = req.body;

  try {
    const post = await Post.findOne({ _id: new mongoose.Types.ObjectId(postId) });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    let targetReply;
    for (let comment of post.comments) {
      targetReply = findReplyById(comment.replies, replyId);
      if (targetReply) break;
    }

    if (!targetReply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const authorized = await isUserAuthorized(post.userId, userId, targetReply.userId, 'friendOwnerOrCommentOwner');
    if (!authorized) {
      return res.status(403).json({
        message: 'You must be friends with the post owner, the reply owner, or the post owner themselves to reply to this reply.',
      });
    }

    const replier = await User.findById(userId);
    if (!replier) {
      return res.status(404).json({ message: 'Replier not found' });
    }

    const newReply = {
      replyId: uuidv4(),
      userId,
      content,
      timestamp: Date.now().toString(),
      replies: [],
    };
    targetReply.replies.push(newReply);

    await post.save();

    return res.status(201).json({
      message: 'Reply added successfully',
      reply: {
        ...newReply,
        username: replier.username,
        profilePicture: replier.profilePicture,
      },
    });
  } catch (error) {
    console.error('Error during addReplyToReply:', error.message);
    return res.status(500).json({ message: 'Server error: ' + error.message });
  }
};



const editComment = async (req, res) => {
  console.log('Received request body:', req.body);  

  let { postId, userId, commentId, newContent } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
      console.log('Invalid postId:', postId);
      return res.status(400).json({ message: 'Invalid postId format' });
  }

  try {
      postId = new mongoose.Types.ObjectId(postId);
      const post = await Post.findById(postId);

      if (!post) {
          console.log('Post not found for postId:', postId);
          return res.status(404).json({ message: 'Post not found' });
      }

      const comment = post.comments.find(c => c.commentId === commentId);
      if (!comment) {
          console.log('Comment not found for commentId:', commentId);
          return res.status(404).json({ message: 'Comment not found' });
      }

      // Verify if the logged-in user is the author of the comment
      if (comment.userId.toString() !== userId) {
          return res.status(403).json({ message: 'You do not have permission to edit this comment' });
      }

      // Update the comment content
      comment.content = newContent;
      await post.save();
      return res.status(200).json({ message: 'Comment edited successfully' });

  } catch (error) {
      console.error('Error during comment edit:', error.message);
      res.status(500).json({ message: 'Server error: ' + error.message });
  }
};


// Delete a Comment
const deleteComment = async (req, res) => {
  console.log('Received request body:', req.body);

  let { postId, userId, commentId } = req.body;
  console.log('Received postId:', postId);

  //postId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(postId)) {
      console.log('Invalid postId:', postId);
      return res.status(400).json({ message: 'Invalid postId format' });
  }

  try {
      // Convert postId to MongoDB ObjectId
      postId = new mongoose.Types.ObjectId(postId);
      const post = await Post.findById(postId);

      if (!post) {
          console.log('Post not found for postId:', postId);
          return res.status(404).json({ message: 'Post not found' });
      }

      // Find the comment to be deleted
      const commentIndex = post.comments.findIndex(c => c.commentId === commentId);
      if (commentIndex === -1) {
          console.log('Comment not found for commentId:', commentId);
          return res.status(404).json({ message: 'Comment not found' });
      }

      const comment = post.comments[commentIndex];

      
      if (comment.userId.toString() !== userId && post.authorId.toString() !== userId) {
          return res.status(403).json({ message: 'You do not have permission to delete this comment' });
      }

      // Remove the comment from the post
      post.comments.splice(commentIndex, 1); //remove the comment at the found index
      await post.save();
      return res.status(200).json({ message: 'Comment deleted successfully' });

  } catch (error) {
      console.error('Error during comment deletion:', error.message);
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
  editComment,
  deleteComment,
  addReplyToReply
};
