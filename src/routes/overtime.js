const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/overtime');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.put('/:id/approve', authenticate, ctrl.approve);
router.put('/:id/reject', authenticate, ctrl.reject);
router.put('/:id', authenticate, ctrl.update);
router.delete('/:id', authenticate, ctrl.cancel);

module.exports = router;
