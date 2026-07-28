const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/holidays');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, requireRole('admin'), ctrl.create);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.remove);

module.exports = router;
