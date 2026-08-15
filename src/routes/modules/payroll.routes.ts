import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/payroll.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/', authenticate, ctrl.getPayroll);
router.get('/summary', authenticate, ctrl.getSummary);
router.get('/financial-report', authenticate, ctrl.getFinancialReport);
router.get('/adjustments', authenticate, ctrl.getAdjustments);
router.post('/year-end-bonus', authenticate, requireRole('admin'), ctrl.runYearEndBonus);
router.put('/:id/salary', authenticate, requireRole('admin'), ctrl.updateSalary);
router.put('/:id/reset-password', authenticate, requireRole('admin'), ctrl.resetPassword);
router.get('/taxes', authenticate, ctrl.getTaxes);
router.put('/:id/tax-profile', authenticate, requireRole('admin'), ctrl.updateTaxProfile);

export default router;
