import express from 'express'
import { authenticate, requireRole } from '../../middleware/auth';
import { getFormLayout, setFormLayout } from '../../controllers/formLayout.controller';
const router = express.Router();

router.get('/', getFormLayout)
router.post('/',authenticate, requireRole('admin', 'lead'), setFormLayout)

export default router;