const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { login, changePassword, me } = require('../controllers/authController');

const router = express.Router();

router.post('/login', login);
router.post('/change-password', authMiddleware, changePassword);
router.get('/me', authMiddleware, me);

module.exports = router;
