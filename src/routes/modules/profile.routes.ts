import express from 'express';
import multer from 'multer';
import path from 'path';
const router = express.Router();
import { authenticate } from '../../middleware/auth';
import * as ctrl from '../../controllers/profile.controller';
import { uploadProfileImage, uploadProfileDocument } from '../../middleware/uplod';

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];

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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      IMAGE_TYPES.includes(ext) ? cb(null, true) : cb(new Error('Only image files are allowed'));
    },
  });
}

router.get('/', authenticate, ctrl.getProfile);
router.put('/', authenticate, ctrl.updateProfile);
router.post('/photo', authenticate, imageUpload('profile/photo').single('photo'), ctrl.uploadPhoto);

// ── Documents ────────────────────────────────────────────────────
// The field names below are the only ones each route accepts (same names as
// POST /onboard). Every field is optional, but send at least one file.

// ID can be citizenship or NID.
const idFiles = uploadProfileImage.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
]);

const panFiles = uploadProfileImage.fields([
  { name: 'panFront', maxCount: 1 },
  { name: 'panBack', maxCount: 1 },
]);

// Up to 4 files.
const educationalFiles = uploadProfileDocument.fields([
  { name: 'educationCertificate_0', maxCount: 1 },
  { name: 'educationCertificate_1', maxCount: 1 },
  { name: 'educationCertificate_2', maxCount: 1 },
  { name: 'educationCertificate_3', maxCount: 1 },
]);

// Previous experience letters, up to 4 files.
const employmentFiles = uploadProfileDocument.fields([
  { name: 'experienceLetter_0', maxCount: 1 },
  { name: 'experienceLetter_1', maxCount: 1 },
  { name: 'experienceLetter_2', maxCount: 1 },
  { name: 'experienceLetter_3', maxCount: 1 },
]);

// Employment contract.
const contractFiles = uploadProfileDocument.fields([{ name: 'contract', maxCount: 1 }]);

// Up to 4 files.
const otherFiles = uploadProfileDocument.fields([
  { name: 'otherDocument_0', maxCount: 1 },
  { name: 'otherDocument_1', maxCount: 1 },
  { name: 'otherDocument_2', maxCount: 1 },
  { name: 'otherDocument_3', maxCount: 1 },
]);

router.patch('/docs/id', authenticate, idFiles, ctrl.uploadDocuments);
router.patch('/docs/pan', authenticate, panFiles, ctrl.uploadDocuments);
router.patch('/docs/educational', authenticate, educationalFiles, ctrl.uploadDocuments);
router.patch('/docs/employment', authenticate, employmentFiles, ctrl.uploadDocuments);
router.patch('/docs/contract', authenticate, contractFiles, ctrl.uploadDocuments);
router.patch('/docs/other', authenticate, otherFiles, ctrl.uploadDocuments);

export default router;
