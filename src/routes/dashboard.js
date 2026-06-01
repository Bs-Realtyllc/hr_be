const express = require('express');
const router = express.Router();
const { getStats, standupTrend, leaveTrend } = require('../controllers/dashboard');
const { authenticate } = require('../middleware/auth');

router.get('/stats', authenticate, getStats);
router.get('/standup-trend', authenticate, standupTrend);
router.get('/leave-trend', authenticate, leaveTrend);

module.exports = router;
