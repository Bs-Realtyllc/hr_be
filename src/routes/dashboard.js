const express = require('express');
const router = express.Router();
const { getStats } = require('../controllers/dashboard');
const { authenticate } = require('../middleware/auth');

router.get('/stats', authenticate, getStats);

module.exports = router;
