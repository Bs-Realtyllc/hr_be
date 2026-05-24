const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/serviceCredentials');

router.get('/', ctrl.get);
router.post('/', ctrl.save);

module.exports = router;
