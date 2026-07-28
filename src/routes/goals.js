const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/goals');
const { authenticate } = require('../middleware/auth');

router.get('/summary', authenticate, ctrl.summary);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.put('/:id/progress', authenticate, ctrl.updateProgress);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
