import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/cultureEvent.controller';

router.get('/upcoming', ctrl.upcoming);
router.get('/', ctrl.list);
router.post('/', ctrl.create);

export default router;
