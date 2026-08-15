import express from 'express';
const router = express.Router();
// Reference example of the standard layering every domain follows:
//   route (this file)
//     -> controller (binds req/res; no DB/business logic — src/controllers/employee.controller.ts)
//       -> service (business logic, orchestrates repositories — src/services/employee.service.ts)
//         -> repository (the only place queries live — src/repositories/employee.repository.ts)
//           -> model (schema only — src/models/Employee.ts, EmployeeFlat.ts, etc.)
// DTOs (src/dtos/employee.dto.ts) sit alongside the controller: they validate
// the request and shape the response, they don't call anything downstream.
import * as ctrl from '../../controllers/employee.controller';
import * as ackCtrl from '../../controllers/policyAcknowledgement.controller';
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
