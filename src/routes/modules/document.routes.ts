import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const router = express.Router();
import { authenticate, requireRole } from '../../middleware/auth';
import * as ctrl from '../../controllers/document.controller';
import * as ackCtrl from '../../controllers/documentAcknowledgement.controller';

function fileUpload(folder: string) {
  const dir = path.join(process.cwd(), 'uploads', folder);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: dir,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path
        .basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 50);
      cb(null, `${base}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const type = req.body?.type;
      if (type === undefined) {
        return cb(new Error('Send the "type" field before the "file" field'));
      }
      if (type === 'folder') {
        return cb(null, false);
      }
      if (type !== 'file') {
        return cb(new Error('type must be "file" or "folder"'));
      }
      cb(null, true);
    },
  });
}

const upload = fileUpload('policies');
const ackUpload = fileUpload('policy-acks');

// ---- Document routes ----
router.get('/', authenticate, ctrl.listDocuments);
router.post('/', authenticate, requireRole('admin'), upload.single('file'), ctrl.uploadDocument);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.deleteDocument);
router.patch('/:id/rename', authenticate, requireRole('admin'), ctrl.renameDocument);
router.put('/:id/pin', authenticate, requireRole('admin'), ctrl.setPinned);
router.get('/:id/file', authenticate, ctrl.openFile);
router.patch('/:id/move', authenticate, ctrl.move);

// ---- Acknowledgement routes ----
// Static paths must come before /:id to avoid route conflicts

// Employee: view all my acknowledgements
router.get('/acknowledgements/mine', authenticate, ackCtrl.myAcknowledgements);

// Admin: view all acknowledgements across every document
router.get('/acknowledgements', authenticate, requireRole('admin'), ackCtrl.listAll);

// Admin: review (approve/reject) a specific acknowledgement
router.patch('/acknowledgements/:ackId/review', authenticate, requireRole('admin'), ackCtrl.review);

// Employee: submit acknowledgement for a specific document (optional signed file upload)
router.post('/:id/acknowledgements', authenticate, ackUpload.single('signedFile'), ackCtrl.submit);

// Admin: list all acknowledgement submissions for a specific document
router.get('/:id/acknowledgements', authenticate, requireRole('admin'), ackCtrl.listForDocument);

export default router;
