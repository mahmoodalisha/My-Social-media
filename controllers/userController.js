const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


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


const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET);
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
      // Find users whose username or email matches the search term
      const users = await User.find({
          $or: [
              { username: { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } }
          ]
      }).select('username email');

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
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const userId = req.user.id;

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
  const userId = req.user.id;

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
    const user = await User.findById(req.params.userId); 

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

// Forgot Password - Send Email with Reset Link
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user with the provided email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    // Use Ethereal for local email testing
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // Generated ethereal user
        pass: testAccount.pass, // Generated ethereal password
      },
    });

    // Compose email content
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      to: user.email,
      from: testAccount.user,
      subject: 'Password Reset Request',
      text: `You are receiving this email because you requested a password reset. Click the link to reset your password: ${resetUrl}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: "Error sending email." });
      }

      // Log the preview URL for Ethereal testing
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      res.status(200).json({ message: "Password reset email sent.", previewUrl: nodemailer.getTestMessageUrl(info) });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Reset Password - Update the user's password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const user = await User.findOne({ 
      resetPasswordToken: token, 
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Hash the new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined; // Clear reset token
    user.resetPasswordExpires = undefined; // Clear expiration date
    await user.save();

    res.status(200).json({ message: "Password successfully updated." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};


module.exports = { registerUser, loginUser, searchUsers, getUserById, uploadProfilePicture, deleteProfilePicture, getProfilePicture, forgotPassword, resetPassword };
