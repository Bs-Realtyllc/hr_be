const express = require('express');
const router = express.Router();
const { verify, receive, month_end_report } = require('../controllers/webhook');

// router.get('/:service', verify);

// router.post('/:service', receive);

router.get('/month-end-report',month_end_report )

module.exports = router;
