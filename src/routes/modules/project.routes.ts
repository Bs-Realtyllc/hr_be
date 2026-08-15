import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/project.controller';

// No auth middleware here — matches the original route file exactly (this
// domain has never required authentication on any of its endpoints).
router.get('/by-employee/:empId', ctrl.byEmployee);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.get('/:id/assignments', ctrl.getAssignments);
router.post('/:id/assignments', ctrl.addAssignment);
router.delete('/:id/assignments/:empId', ctrl.removeAssignment);
router.get('/:id/milestones', ctrl.getMilestones);
router.post('/:id/milestones', ctrl.addMilestone);
router.put('/:id/milestones/:mid', ctrl.updateMilestone);

router.get('/:id/services', ctrl.getServices);
router.post('/:id/services', ctrl.addService);
router.delete('/:id/services/:serviceKey', ctrl.removeService);

export default router;
