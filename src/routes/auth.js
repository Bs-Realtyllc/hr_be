const express = require('express');
const router = express.Router();
const { login, changePassword } = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.put('/password', authenticate, changePassword);

module.exports = router;
