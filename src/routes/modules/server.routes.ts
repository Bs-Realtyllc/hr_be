import express from 'express';
const router = express.Router();
import * as ctrl from '../../controllers/server.controller';

// No auth middleware — matches the original route file exactly.
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
