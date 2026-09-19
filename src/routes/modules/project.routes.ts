import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/project.controller';
import * as todoCtrl from '../../controllers/projectTodo.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/by-employee/:empId',authenticate, ctrl.byEmployee);
router.get('/',authenticate, ctrl.list);
router.post('/',authenticate,requireRole('admin'), ctrl.create);
router.put('/:id',authenticate,requireRole('admin'), ctrl.update);
router.delete('/:id',authenticate,requireRole('admin'), ctrl.remove);
router.get('/:id/assignments',authenticate, ctrl.getAssignments);
router.post('/:id/assignments',authenticate,requireRole('admin'), ctrl.addAssignment);
router.delete('/:id/assignments/:empId',authenticate,requireRole('admin'), ctrl.removeAssignment);
router.get('/:id/milestones',authenticate, ctrl.getMilestones);
router.post('/:id/milestones',authenticate,requireRole('admin'), ctrl.addMilestone);
router.put('/:id/milestones/:mid',authenticate,requireRole('admin'), ctrl.updateMilestone);

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
