const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/dashboard', require('./dashboard'));
router.use('/employees', require('./employees'));
router.use('/leaves', require('./leaves'));
router.use('/standups', require('./standups'));
router.use('/projects', require('./projects'));
router.use('/events', require('./events'));
router.use('/servers', require('./servers'));
router.use('/payroll', require('./payroll'));
router.use('/discord', require('./discord'));
router.use('/email-settings', require('./emailSettings'));
router.use('/reports', require('./reports'));
router.use('/service-credentials/:employeeId', require('./serviceCredentials'));
router.use('/google',  require('./google'));
router.use('/profile', require('./profile'));

module.exports = router;
