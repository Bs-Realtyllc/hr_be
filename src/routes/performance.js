const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/performance');
const { authenticate } = require('../middleware/auth');

router.get('/trend/:employeeId', authenticate, ctrl.trend);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.put('/:id/submit', authenticate, ctrl.submit);
router.put('/:id/acknowledge', authenticate, ctrl.acknowledge);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
