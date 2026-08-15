const express = require('express');
const router = express.Router();

router.use('/auth', require('./modules/auth.routes').default);
router.use('/dashboard', require('./dashboard'));
router.use('/employees', require('./modules/employee.routes').default);
router.use('/leaves', require('./leaves'));
router.use('/standups', require('./standups'));
router.use('/projects', require('./projects'));
router.use('/events', require('./events'));
router.use('/holidays', require('./holidays'));
router.use('/servers', require('./servers'));
router.use('/payroll', require('./payroll'));
router.use('/overtime', require('./overtime'));
router.use('/discord', require('./discord'));
router.use('/webhooks', require('./webhook'));
router.use('/email-settings', require('./emailSettings'));
router.use('/reports', require('./reports'));
router.use('/weekly-reports', require('./weeklyReports'));
router.use('/service-credentials/:employeeId', require('./serviceCredentials'));
router.use('/google',  require('./google'));
router.use('/profile', require('./profile'));
router.use('/goals', require('./goals'));
router.use('/performance', require('./performance'));
router.use('/feedback', require('./feedback'));
router.use('/policies', require('./policies'));

module.exports = router;
