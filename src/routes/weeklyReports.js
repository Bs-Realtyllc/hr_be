const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const router  = express.Router();
const ctrl    = require('../controllers/weeklyReports');
const { authenticate } = require('../middleware/auth');
const { getWeekStartDate } = require('../pkg/weekUtil');

const ALLOWED = ['.pdf', '.ppt', '.pptx'];
const UPLOAD_ROOT = path.join(__dirname, '../../uploads/weekly-reports');

const storage = multer.diskStorage({
  // One folder per week, named after that week's Monday (e.g. uploads/weekly-reports/2026-07-20/).
  destination: (_req, _file, cb) => {
    const weekDir = path.join(UPLOAD_ROOT, getWeekStartDate());
    fs.mkdirSync(weekDir, { recursive: true });
    cb(null, weekDir);
  },
  filename: (_req, file, cb) => {
    // Temporary name — the controller renames this to `<EmployeeName>_<timestamp>` once
    // req.user is available (multer runs before the employee-name rename can happen here).
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
