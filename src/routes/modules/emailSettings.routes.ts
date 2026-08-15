import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/emailSettings.controller';

// No auth middleware — matches the original route file exactly.
router.get('/:employeeId', ctrl.get);
router.put('/:employeeId', ctrl.save);

export default router;
