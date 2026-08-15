import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
import * as ctrl from '../../controllers/monthlyReport.controller';
import { authenticate } from '../../middleware/auth';

const ALLOWED = ['.pdf', '.pptx', '.ppt', '.docx', '.doc'];

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), 'uploads', 'reports'),
  filename: (_req, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED.includes(ext)) return cb(null, true);
    cb(new Error(`Only ${ALLOWED.join(', ')} files are allowed`));
  },
});

router.get('/', authenticate, ctrl.list);
router.post('/', upload.single('file'), authenticate, ctrl.submit);
router.get('/:id/download', authenticate, ctrl.download);
router.delete('/:id', authenticate, ctrl.remove);

export default router;
