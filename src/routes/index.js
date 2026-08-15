const express = require('express');
const router = express.Router();

// Every domain lives in src/routes/modules/index.ts now — see that file for
// the full list. This just mounts the whole aggregate router.
router.use(require('./modules').default);

module.exports = router;
