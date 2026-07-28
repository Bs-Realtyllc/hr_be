const express = require('express');
const router = express.Router();
const {
  getPayroll, updateSalary, resetPassword, getTaxes, updateTaxProfile,
  getAdjustments, getSummary, runYearEndBonus, getFinancialReport,
} = require('../controllers/payroll');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, getPayroll);
router.get('/summary', authenticate, getSummary);
router.get('/financial-report', authenticate, getFinancialReport);
router.get('/adjustments', authenticate, getAdjustments);
router.post('/year-end-bonus', authenticate, requireRole('admin'), runYearEndBonus);
router.put('/:id/salary', authenticate, requireRole('admin'), updateSalary);
router.put('/:id/reset-password', authenticate, requireRole('admin'), resetPassword);
router.get('/taxes', authenticate, getTaxes);
router.put('/:id/tax-profile', authenticate, requireRole('admin'), updateTaxProfile);

module.exports = router;
