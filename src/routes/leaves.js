const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/leaves');

router.get('/out/today', ctrl.outToday);
router.get('/out/week', ctrl.outThisWeek);
router.get('/balances/:employeeId', ctrl.balances);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id/approve', ctrl.approve);
router.put('/:id/reject', ctrl.reject);

module.exports = router;
