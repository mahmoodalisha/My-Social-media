// controllers/userController.js
const mongoose = require('mongoose');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


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


module.exports = { registerUser, loginUser };
