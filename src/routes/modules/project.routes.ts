import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/project.controller';
import * as todoCtrl from '../../controllers/projectTodo.controller';
import { authenticate, requireRole } from '../../middleware/auth';

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

router.get('/:id/todos', authenticate, todoCtrl.list);
router.get('/:id/todos/summary', authenticate, todoCtrl.summary);
router.post('/:id/todos', authenticate, requireRole('admin'), todoCtrl.create);
router.put('/:id/todos/:tid', authenticate, requireRole('admin'), todoCtrl.update);
router.patch('/:id/todos/:tid/toggle', authenticate, requireRole('admin'), todoCtrl.toggle);
router.delete('/:id/todos/:tid', authenticate, requireRole('admin'), todoCtrl.remove);

export default router;
