import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
import { authenticate, requireRole } from '../../middleware/auth';
import * as ctrl from '../../controllers/document.controller';
import fs from 'fs'
// import * as ackCtrl from '../../controllers/policyAcknowledgement.controller';

function pdfUpload(folder: string) {
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
        return cb(null, false); // skip saving the file entirely
      }
      if (type !== 'file') {
        return cb(new Error('type must be "file" or "folder"'));
      }

      const ext = path.extname(file.originalname).toLowerCase();
      ext === '.pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
    },
  });
}

const upload = pdfUpload('policies');
const ackUpload = pdfUpload('policy-acks');

router.get('/', authenticate, ctrl.listDocuments);
router.post('/', authenticate, requireRole('admin'), upload.single('file'), ctrl.uploadDocument);
router.delete('/:id', authenticate, requireRole('admin'), ctrl.deleteDocument);
router.patch('/:id/rename', authenticate, requireRole('admin'), ctrl.renameDocument);
router.put('/:id/pin', authenticate, requireRole('admin'), ctrl.setPinned);
router.get('/:id/file', authenticate, ctrl.openFile)

export default router;
