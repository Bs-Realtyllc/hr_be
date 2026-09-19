import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/leave.controller';
import { authenticate, requireRole } from '../../middleware/auth';

router.get('/out/today',authenticate, ctrl.outToday);
router.get('/out/week',authenticate, ctrl.outThisWeek);
router.get('/balances/:employeeId',authenticate, ctrl.balances);
router.get('/report', authenticate, requireRole('admin'), ctrl.report);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.put('/:id/approve', authenticate, ctrl.approve);
router.put('/:id/reject', authenticate, ctrl.reject);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.cancel);
//create leave request from mail -- no authentication
router.post('/mail', ctrl.createViaMail);


export default router;
