const express = require('express');
const router = express.Router();
const { login, getMe, getUsers, registerUser } = require('../controllers/auth.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, adminOnly, getUsers);
router.post('/register', protect, adminOnly, registerUser);

module.exports = router;
