const express = require('express');
const multer  = require('multer');
const path    = require('path');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/profile');

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];

function imageStorage(folder) {
  return multer.diskStorage({
    destination: path.join(__dirname, '../../uploads', folder),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, safe);
    },
  });
}

function imageUpload(folder) {
  return multer({
    storage: imageStorage(folder),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      IMAGE_TYPES.includes(ext) ? cb(null, true) : cb(new Error('Only image files are allowed'));
    },
  });
}

router.get('/',                          authenticate, ctrl.getProfile);
router.put('/',                          authenticate, ctrl.updateProfile);
router.put('/accept-leave-policy',       authenticate, ctrl.acceptLeavePolicy);
router.post('/photo',                    authenticate, imageUpload('profile').single('photo'), ctrl.uploadPhoto);
router.post('/citizenship/:side',        authenticate, imageUpload('docs').single('doc'), ctrl.uploadCitizenship);

module.exports = router;
