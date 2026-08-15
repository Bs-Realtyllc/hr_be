import express from 'express';
const router = express.Router();
import { month_end_report } from '../../controllers/webhook.controller';

// router.get('/:service', verify);

// router.post('/:service', receive);

router.get('/month-end-report', month_end_report);

export default router;
