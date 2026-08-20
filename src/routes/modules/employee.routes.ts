import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/employee.controller';
import * as ackCtrl from '../../controllers/policyAcknowledgement.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/', authenticate, ctrl.list);
router.get('/onboarding', authenticate, requireRole('admin'), ctrl.listOnboarding);
router.get('/:id', authenticate, ctrl.get);
router.get('/:id/tax-profile', authenticate, ctrl.getTaxProfile);
router.get('/:id/compensation-history', authenticate, ctrl.getCompensationHistory);
router.get('/:id/payroll-summary', authenticate, requireRole('admin', 'lead'), ctrl.payrollSummary);
router.get('/:id/acknowledgements', authenticate, requireRole('admin'), ackCtrl.listForEmployeeAdmin);

router.post('/', authenticate, requireRole('admin', 'lead'), ctrl.create);
router.put('/:id', authenticate, requireRole('admin', 'lead'), ctrl.update);
router.put('/:id/approve', authenticate, requireRole('admin'), ctrl.approve);
router.put('/:id/reject', authenticate, requireRole('admin'), ctrl.reject);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

export default router;
