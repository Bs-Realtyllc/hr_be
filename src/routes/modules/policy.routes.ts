import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
import { authenticate, requireRole } from '../../middleware/auth';
import * as ctrl from '../../controllers/policy.controller';
import * as ackCtrl from '../../controllers/policyAcknowledgement.controller';

function pdfUpload(folder: string) {
  const storage = multer.diskStorage({
    destination: path.join(process.cwd(), 'uploads', folder),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, safe);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      ext === '.pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
    },
  });
}

const upload = pdfUpload('policies');
const ackUpload = pdfUpload('policy-acks');

router.get('/', authenticate, ctrl.listPolicies);
router.post('/', authenticate, requireRole('admin'), upload.single('file'), ctrl.uploadPolicy);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.deletePolicy);
router.put('/:id/pin', authenticate, requireRole('admin'), ctrl.setPinned);

router.get('/acknowledgements/mine', authenticate, ackCtrl.myAcknowledgements);
router.post('/:id/acknowledgements', authenticate, ackUpload.single('file'), ackCtrl.submitAcknowledgement);
router.get('/:id/acknowledgements', authenticate, requireRole('admin'), ackCtrl.listSubmissions);
router.put('/acknowledgements/:ackId/review', authenticate, requireRole('admin'), ackCtrl.reviewSubmission);

export default router;
