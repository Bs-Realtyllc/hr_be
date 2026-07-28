const express = require('express');
const router = express.Router();
const { verify, receive } = require('../controllers/webhook');

router.get('/:service', verify);

router.post('/:service', receive);

module.exports = router;
