import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/employee.controller';
// Not yet converted — untouched .js controller for a domain outside this pilot.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ackCtrl = require('../../controllers/policyAcknowledgements');
import { authenticate, requireRole } from '../../middleware/auth';

// Read access: any authenticated employee (many non-admin pages — culture, feedback,
// standups, goals, performance, projects, dashboard — list/display employees).
router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.get);
router.get('/:id/payroll-summary', authenticate, requireRole('admin', 'lead'), ctrl.payrollSummary);
router.get('/:id/acknowledgements', authenticate, requireRole('admin'), ackCtrl.listForEmployeeAdmin);

// Write access: admin/lead only, matching the "Add Employee" gating already enforced
// client-side in employees/page.tsx (isAdmin/isPrivileged) — this closes the gap where
// the API itself previously enforced nothing.
router.post('/', authenticate, requireRole('admin', 'lead'), ctrl.create);
router.put('/:id', authenticate, requireRole('admin', 'lead'), ctrl.update);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

export default router;
