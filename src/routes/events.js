const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/events');

router.get('/upcoming', ctrl.upcoming);
router.get('/', ctrl.list);
router.post('/', ctrl.create);

module.exports = router;
