const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/employees');
const ackCtrl = require('../controllers/policyAcknowledgements');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/:id/payroll-summary', ctrl.payrollSummary);
router.get('/:id/acknowledgements', authenticate, requireRole('admin'), ackCtrl.listForEmployeeAdmin);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
