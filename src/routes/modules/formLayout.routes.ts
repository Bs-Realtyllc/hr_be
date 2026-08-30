import express from 'express'
import multer from 'multer';
import path from 'path';
import { authenticate, requireRole } from '../../middleware/auth';
import {
  getFormLayout,
  setFormLayout,
  uploadContractTemplate,
  downloadContractTemplate,
  deleteContractTemplate,
} from '../../controllers/formLayout.controller';
const router = express.Router();

const templateUpload = multer({
  storage: multer.diskStorage({
    destination: path.join(process.cwd(), 'uploads', 'templates'),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF or Word documents are allowed'));
  },
});

router.get('/', getFormLayout)
router.post('/',authenticate, requireRole('admin', 'lead'), setFormLayout)

// Admin-configured default contract template — interns/employees download it
// as the "get started" file for the Contract File Upload section.
router.get('/template', downloadContractTemplate)
router.post('/template', authenticate, requireRole('admin', 'lead'), templateUpload.single('file'), uploadContractTemplate)
router.delete('/template', authenticate, requireRole('admin', 'lead'), deleteContractTemplate)

export default router;