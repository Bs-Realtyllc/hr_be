const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/leaves');
const { authenticate } = require('../middleware/auth');

router.get('/out/today', ctrl.outToday);
router.get('/out/week', ctrl.outThisWeek);
router.get('/balances/:employeeId', ctrl.balances);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.put('/:id/approve', authenticate, ctrl.approve);
router.put('/:id/reject', authenticate, ctrl.reject);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.cancel);

module.exports = router;
