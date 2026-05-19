const express = require('express');
const router = express.Router();
const { getPayroll, updateSalary, resetPassword } = require('../controllers/payroll');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, requireRole('admin'), getPayroll);
router.put('/:id/salary', authenticate, requireRole('admin'), updateSalary);
router.put('/:id/reset-password', authenticate, requireRole('admin'), resetPassword);

module.exports = router;
