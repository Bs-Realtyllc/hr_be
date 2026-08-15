import express from 'express';
const router = express.Router({ mergeParams: true });
import * as ctrl from '../../controllers/serviceCredential.controller';

router.get('/', ctrl.get);
router.post('/', ctrl.save);

export default router;
