const express = require('express');
const router = express.Router();
const { login, changePassword, forgotPassword, resetPassword } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');

router.post('/login',           login);
router.put('/password',         authenticate, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

module.exports = router;
