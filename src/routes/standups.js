const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/standups');

router.get('/today', ctrl.today);
router.get('/', ctrl.list);
router.post('/', ctrl.create);

module.exports = router;
