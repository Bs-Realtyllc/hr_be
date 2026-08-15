import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
import { authenticate } from '../../middleware/auth';
import * as ctrl from '../../controllers/profile.controller';

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];

// process.cwd() (not __dirname) — this file compiles into dist/, where
// __dirname would resolve under dist/ instead of the real uploads/ at the
// project root.
function imageStorage(folder: string) {
  return multer.diskStorage({
    destination: path.join(process.cwd(), 'uploads', folder),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, safe);
    },
  });
}

function imageUpload(folder: string) {
  return multer({
    storage: imageStorage(folder),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      IMAGE_TYPES.includes(ext) ? cb(null, true) : cb(new Error('Only image files are allowed'));
    },
  });
}

router.get('/', authenticate, ctrl.getProfile);
router.put('/', authenticate, ctrl.updateProfile);
router.put('/accept-leave-policy', authenticate, ctrl.acceptLeavePolicy);
router.post('/photo', authenticate, imageUpload('profile').single('photo'), ctrl.uploadPhoto);
router.post('/citizenship/:side', authenticate, imageUpload('docs').single('doc'), ctrl.uploadCitizenship);

export default router;
