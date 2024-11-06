// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, searchUsers } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/search', searchUsers);

module.exports = router;