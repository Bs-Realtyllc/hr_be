import multer from "multer";
import path from "path";
import fs from "fs";

// Make sure the 'uploads/' directory exists
const FIELD_DESTINATIONS: Record<string, string> = {
  contract: "uploads/nda",
  citizenshipFront: "uploads/profile/citizenship",
  citizenshipBack: "uploads/profile/citizenship",
  panCard: "uploads/profile/PAN",
  passoutCertificate: "uploads/profile/certificate",
  passportPhoto: "uploads/profile/photo",
};

// Define storage engine and destination directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
<<<<<<< HEAD
    const relativeDest = FIELD_DESTINATIONS[file.fieldname];
    if (!relativeDest) {
      cb(new Error(`Unexpected file field: ${file.fieldname}`), "");
      return;
    }
    const dir = path.join(process.cwd(), relativeDest);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
=======
    const dest = FIELD_DESTINATIONS[file.fieldname];
    if (!dest) {
      cb(new Error(`Unexpected file field: ${file.fieldname}`), "");
      return;
    }
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest); 
>>>>>>> d5808aa (additional documents in onboarding)
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
<<<<<<< HEAD
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
=======
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
>>>>>>> d5808aa (additional documents in onboarding)

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
<<<<<<< HEAD
    cb(new Error("Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX are allowed."));
=======
    cb(new Error("Invalid file type. Only JPEG, PNG, and PDF are allowed."));
>>>>>>> d5808aa (additional documents in onboarding)
  }
};

// Export multer instance with limits (e.g., 5MB max size)
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
