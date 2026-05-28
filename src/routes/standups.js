const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/standups');
const { authenticate } = require('../middleware/auth');

router.get('/today', authenticate, ctrl.today);
router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, ctrl.create);

module.exports = router;
