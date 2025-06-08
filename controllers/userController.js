const mongoose = require('mongoose');
const User = require('../models/User');
const Otp = require("../models/Otp");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
require('dotenv').config();


const upload = multer({ 
  storage: multer.memoryStorage(), 
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


const searchUsers = async (req, res) => {
  const { searchTerm } = req.query; 

  if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required' });
  }

  try {
      
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
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const userId = req.user.id;

  try {
    
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'profile-pictures',
            transformation: [{ width: 300, height: 300, crop: 'fill' }],
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);

    const user = await User.findById(userId);
    user.profilePicture = result.secure_url;
    await user.save();

    res.status(200).json({ message: 'Profile picture uploaded successfully', profilePicture: result.secure_url });
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

    
    const parts = user.profilePicture.split('/');
    const fileName = parts[parts.length - 1].split('.')[0];
    const publicId = `profile-pictures/${fileName}`;

    await cloudinary.uploader.destroy(publicId);

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
  return res.status(200).json({
    message: "Profile picture not set",
    userId: req.params.userId,
    profilePicture: null 
  });
}


    
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


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const requestOtp = async (req, res) => {
  const { email } = req.body;

  try {
    // ✅ Check if email exists in User collection
    const userExists = await User.findOne({ email });
    if (!userExists) {
      return res.status(404).json({ message: "This email is not associated with any account." });
    }

    // ⏳ Check if an OTP was already sent within the last 2 minutes
    const recentOtp = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (
      recentOtp &&
      Date.now() - new Date(recentOtp.createdAt).getTime() < 120000
    ) {
      return res.status(429).json({
        message: "Please wait 2 minutes before requesting another OTP.",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp });

    await transporter.sendMail({
      from: '"Login OTP" <mahmoodalisha35@gmail.com>',
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    });

    res.status(200).json({ message: "OTP sent to email." });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ message: "Failed to send OTP." });
  }
};



const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const validOtp = await Otp.findOne({ email, otp });

    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ email });

    let user = await User.findOne({ email });
    if (!user) {
      
      user = await User.create({ email });
    }

    res.status(200).json({ message: "OTP verified", user });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: "Server error." });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      from: `"instagram" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      text: `You are receiving this email because you requested a password reset. Click the link to reset your password: ${resetUrl}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email." });
      }

      console.log("Email sent:", info.response);
      res.status(200).json({ message: "Password reset email sent." });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};


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

    
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined; 
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password successfully updated." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error." });
  }
};


module.exports = { registerUser, loginUser, searchUsers, getUserById, uploadProfilePicture, deleteProfilePicture, getProfilePicture, forgotPassword, resetPassword, requestOtp, verifyOtp};
