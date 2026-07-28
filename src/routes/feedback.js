const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/feedback');
const { authenticate } = require('../middleware/auth');

router.get('/summary', authenticate, ctrl.summary);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
