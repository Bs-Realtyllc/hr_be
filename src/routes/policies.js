const express = require('express');
const multer  = require('multer');
const path    = require('path');
const router  = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/policies');
const ackCtrl = require('../controllers/policyAcknowledgements');

function pdfUpload(folder) {
  const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../uploads', folder),
    filename: (_req, file, cb) => {
      const ext  = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, safe);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      ext === '.pdf' ? cb(null, true) : cb(new Error('Only PDF files are allowed'));
    },
  });
}

const upload = pdfUpload('policies');
const ackUpload = pdfUpload('policy-acks');

router.get('/',                    authenticate,                        ctrl.listPolicies);
router.post('/',                   authenticate, requireRole('admin'), upload.single('file'), ctrl.uploadPolicy);
router.delete('/:id',               authenticate, requireRole('admin'), ctrl.deletePolicy);
router.put('/:id/pin',              authenticate, requireRole('admin'), ctrl.setPinned);

router.get('/acknowledgements/mine', authenticate, ackCtrl.myAcknowledgements);
router.post('/:id/acknowledgements', authenticate, ackUpload.single('file'), ackCtrl.submitAcknowledgement);
router.get('/:id/acknowledgements',  authenticate, requireRole('admin'), ackCtrl.listSubmissions);
router.put('/acknowledgements/:ackId/review', authenticate, requireRole('admin'), ackCtrl.reviewSubmission);

module.exports = router;
