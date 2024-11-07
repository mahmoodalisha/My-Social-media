// controllers/userController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

// Configure the multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profile-pictures';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Initialize multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};


const registerUser = async (req, res) => {
  const { username, email, password } = req.body; 

  try {
    const hashedPassword = await bcrypt.hash(password, 10); 
    const user = new User({ username, email, password: hashedPassword }); 
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};


const loginUser = async (req, res) => {
  const { email, password } = req.body; 

  try {
    const user = await User.findOne({ email }); 
    if (!user || !(await bcrypt.compare(password, user.password))) { 
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id); 
    res.status(200).json({ message: 'Login successful', userId: user._id, token }); 
  } catch (error) {
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Search users based on a search term (username or email)
const searchUsers = async (req, res) => {
  const { searchTerm } = req.query; // searchTerm will come from the query parameters

  if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required' });
  }

  try {
      // Find users whose username or email matches the search term (case insensitive)
      const users = await User.find({
          $or: [
              { username: { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } }
          ]
      }).select('username email'); // Select only username and email to avoid sending sensitive data

      if (users.length === 0) {
          return res.status(404).json({ message: 'No users found' });
      }

      res.status(200).json(users);
  } catch (error) {
      return res.status(500).json({ message: 'Error searching users: ' + error.message });
  }
};

const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId); 
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
}; 



const uploadProfilePicture = async (req, res) => {
  console.log(req.file); // Log to check the file object being uploaded
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const userId = req.user.id; // user ID is in the request object (from authentication)

  try {
    // Resize the uploaded image to multiple sizes
    const sizes = ['small', 'medium', 'large'];
    const resizedPaths = [];

    for (const size of sizes) {
      const resizedFilePath = path.join('uploads/profile-pictures', `${size}-${req.file.filename}`);
      await sharp(filePath)
        .resize(size === 'small' ? 50 : size === 'medium' ? 150 : 300) // Resize based on size type
        .toFile(resizedFilePath);
      resizedPaths.push(resizedFilePath);
    }

    // Save the image paths in the user document
    const user = await User.findById(userId);
    user.profilePicture = resizedPaths[2]; // Save the large size as the main profile picture
    await user.save();

    res.status(200).json({ message: 'Profile picture uploaded successfully', profilePicture: resizedPaths[2] });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading profile picture', error: error.message });
  }
};

 

const deleteProfilePicture = async (req, res) => {
  const userId = req.user.id; //user ID is in the request object (from authentication)

  try {
    const user = await User.findById(userId);
    if (!user || !user.profilePicture) {
      return res.status(404).json({ message: 'Profile picture not found' });
    }

    // Delete the profile picture file (along with resized versions)
    const filePaths = ['small', 'medium', 'large'].map(size => 
      path.join('uploads/profile-pictures', `${size}-${path.basename(user.profilePicture)}`)
    );
    
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    // Remove the profile picture path from the user
    user.profilePicture = null;
    await user.save();

    res.status(200).json({ message: 'Profile picture deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting profile picture', error: error.message });
  }
};

const getProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId); // Use req.params.userId instead of req.user.id

    if (!user) {
      return res.status(404).json({ message: "User not found", userId: req.params.userId });
    }

    if (!user.profilePicture) {
      return res.status(404).json({ 
        message: "Profile picture not set", 
        userId: req.params.userId 
      });
    }

    // If the user exists and has a profile picture set
    res.status(200).json({ 
      message: "Profile picture found", 
      userId: req.params.userId, 
      profilePicture: user.profilePicture 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching profile picture", 
      error: error.message 
    });
  }
};


module.exports = { registerUser, loginUser, searchUsers, getUserById, uploadProfilePicture, deleteProfilePicture, getProfilePicture };
