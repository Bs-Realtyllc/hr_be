import multer from "multer";
import path from "path";
import fs from "fs";
import AppError from "../pkg/AppError";

// Make sure the 'uploads/' directory exists
export const FIELD_DESTINATIONS: Record<string, string> = {
  passportPhoto: "uploads/profile/photo",
  idFront: "uploads/profile/id",
  idBack: "uploads/profile/id",
  panFront: "uploads/profile/PAN",
  panBack: "uploads/profile/PAN",
  additionalDocument: "uploads/profile/additional",
  contract: "uploads/nda",
  otherDocument: "uploads/profile/other",
  // Per-entry files arrive as educationCertificate_0, experienceLetter_1, ...
  educationCertificate: "uploads/profile/certificate",
  experienceLetter: "uploads/profile/experience",
};

// Define storage engine and destination directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const relativeDest = FIELD_DESTINATIONS[file.fieldname.replace(/_\d+$/, "")];
    if (!relativeDest) {
      cb(new Error(`Unexpected file field: ${file.fieldname}`), "");
      return;
    }
    const dir = path.join(process.cwd(), relativeDest);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File type validation filter
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX are allowed."));
  }
};

// Export multer instance with limits (e.g., 5MB max size)
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/* ── Profile documents (PATCH /profile/docs/*) ─────────────────
 * Same storage as onboarding, so files are saved as
 * "<field>-<timestamp>-<random>.<ext>", e.g. idFront-1794713986605-124611939.jpeg */

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_AND_PDF_TYPES = [...IMAGE_TYPES, "application/pdf"];

// JPG, JPEG, PNG, WEBP only — max 5 MB (ID and PAN)
export const uploadProfileImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError("Only JPG, JPEG, PNG or WEBP files are allowed.", 400));
  },
});

// Images or PDF — max 5 MB (educational and employment documents)
export const uploadProfileDocument = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_AND_PDF_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new AppError("Only JPG, JPEG, PNG, WEBP or PDF files are allowed.", 400));
  },
});

/* ── Audio upload (DM voice messages) ──────────────────────── */

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads/audio');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = file.mimetype === 'audio/webm' ? '.webm'
              : file.mimetype === 'audio/ogg'  ? '.ogg'
              : file.mimetype === 'audio/mpeg' ? '.mp3'
              : '.webm';
    cb(null, `audio-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const audioFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-m4a'];
  const baseMime = file.mimetype.split(';')[0].trim();
  if (allowed.includes(baseMime)) cb(null, true);
  else cb(new Error('Only audio files are allowed'));
};

export const uploadAudio = multer({
  storage: audioStorage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

/* Memory storage variant — streams directly to MinIO, no local disk write */
export const uploadAudioMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: audioFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
});
