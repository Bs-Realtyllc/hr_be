import multer from "multer";
import path from "path";
import fs from "fs";
import AppError from "../pkg/AppError";

/**
 * Multipart file fields sent by the /onboard/:role form, the folder (relative to the
 * app root) each one is saved under, and whether the form requires it.
 */
export const ONBOARD_FILE_FIELDS = {
  citizenshipFront: { dir: "uploads/profile/citizenship", required: true },
  citizenshipBack: { dir: "uploads/profile/citizenship", required: true },
  panFront: { dir: "uploads/profile/PAN", required: true },
  panBack: { dir: "uploads/profile/PAN", required: true },
  educational: { dir: "uploads/profile/certificate", required: true },
  additional: { dir: "uploads/profile/additional", required: true },
  signedContract: { dir: "uploads/contract/signed", required: true },
  offerLetter: { dir: "uploads/contract/offer-letter", required: false },
  otherEmployment: { dir: "uploads/contract/other", required: false },
} as const;

export type OnboardFileField = keyof typeof ONBOARD_FILE_FIELDS;

const FIELD_DESTINATIONS: Record<string, string> = Object.fromEntries(
  Object.entries(ONBOARD_FILE_FIELDS).map(([field, { dir }]) => [field, dir]),
);

// Define storage engine and destination directory (created on demand)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const relativeDest = FIELD_DESTINATIONS[file.fieldname];
    if (!relativeDest) {
      cb(new AppError(`Unexpected file field: ${file.fieldname}`, 400), "");
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
    cb(
      new AppError(
        `Invalid file type for ${file.fieldname}. Only JPEG, PNG, PDF, DOC, and DOCX are allowed.`,
        400,
      ),
    );
  }
};

// Export multer instance with limits
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// Accepts every onboarding document field (one file each) into the uploads folder.
export const uploadOnboardDocuments = upload.fields(
  Object.keys(ONBOARD_FILE_FIELDS).map((name) => ({ name, maxCount: 1 })),
);

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

/** Path to persist in the DB for a saved file, relative to the app root: "uploads/…/file.pdf". */
export function toStoredPath(file: Express.Multer.File): string {
  return path.relative(process.cwd(), file.path).split(path.sep).join("/");
}

/**
 * Resolves a DB-stored relative path back to an absolute one, or null if it would
 * point outside the uploads folder.
 */
export function resolveStoredPath(stored: string): string | null {
  const absolute = path.resolve(process.cwd(), stored);
  return absolute.startsWith(UPLOADS_ROOT + path.sep) ? absolute : null;
}

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
