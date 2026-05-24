const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emailSettings');

router.get('/:employeeId',  ctrl.get);
router.put('/:employeeId',  ctrl.save);

module.exports = router;
