const express = require('express');
const router = express.Router();

router.use('/employees', require('./employees'));
router.use('/leaves', require('./leaves'));
router.use('/standups', require('./standups'));
router.use('/projects', require('./projects'));
router.use('/events', require('./events'));
router.use('/servers', require('./servers'));

module.exports = router;
