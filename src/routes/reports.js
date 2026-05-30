const express = require('express');
const multer  = require('multer');
const path    = require('path');
const router  = express.Router();
const ctrl    = require('../controllers/reports');
const { authenticate } = require('../middleware/auth');

const ALLOWED = ['.pdf', '.pptx', '.ppt', '.docx', '.doc'];

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/reports'),
  filename: (_req, file, cb) => {
    const ts   = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${ts}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED.includes(ext)) return cb(null, true);
    cb(new Error(`Only ${ALLOWED.join(', ')} files are allowed`));
  },
});

router.get('/',                               authenticate, ctrl.list);
router.post('/',    upload.single('file'),    authenticate, ctrl.submit);
router.get('/:id/download',                  authenticate, ctrl.download);
router.delete('/:id',                        authenticate, ctrl.remove);

module.exports = router;
