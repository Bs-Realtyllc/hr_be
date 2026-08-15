const express = require('express');
const router = express.Router();
const { login, changePassword, forgotPassword, resetPassword } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');

router.post('/login',           authLimiter, login);
router.put('/password',         authenticate, changePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password',  authLimiter, resetPassword);

module.exports = router;
