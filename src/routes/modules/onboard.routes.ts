import express from "express";
import * as ctrl from "../../controllers/onboard.controller";
import {
  authenticate,
  authenticateOnboardFileToken,
  requireRole,
} from "../../middleware/auth";
import { upload } from "../../middleware/uplod";
const router = express.Router();

router.get("/", authenticate, requireRole('admin', 'lead'), ctrl.list);

// Public lookup so the onboarding form can pre-fill itself — same unauthenticated
// surface as the POST below, since the candidate isn't logged in when they land here.
router.get("/draft", ctrl.getDraft);
// All uploads are optional. educationCertificate_<i> / experienceLetter_<i> belong to
// education_info[i] / previous_experience_info[i] in the payload (up to 5 each).
router.post(
  "/",
  upload.fields([
    { name: "passportPhoto", maxCount: 1 },
    { name: "idFront", maxCount: 1 },
    { name: "idBack", maxCount: 1 },
    { name: "panFront", maxCount: 1 },
    { name: "panBack", maxCount: 1 },
    { name: "additionalDocument", maxCount: 1 },
    { name: "contract", maxCount: 1 },
    { name: "otherDocument", maxCount: 1 },
    { name: "educationCertificate_0", maxCount: 1 },
    { name: "educationCertificate_1", maxCount: 1 },
    { name: "educationCertificate_2", maxCount: 1 },
    { name: "educationCertificate_3", maxCount: 1 },
    { name: "educationCertificate_4", maxCount: 1 },
    { name: "experienceLetter_0", maxCount: 1 },
    { name: "experienceLetter_1", maxCount: 1 },
    { name: "experienceLetter_2", maxCount: 1 },
    { name: "experienceLetter_3", maxCount: 1 },
    { name: "experienceLetter_4", maxCount: 1 },
  ]),
  ctrl.add,
);
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("lead", "admin"),
  ctrl.approve,
);
router.patch("/:id/reject", authenticate, requireRole("lead", "admin"), ctrl.remove);

// View an uploaded file in a new window. :type is the upload field name, e.g. idFront
// or educationCertificate_0. A new window can't send the Authorization header, so:
//   1. GET /:id/:type/url (authenticated) returns a 15-minute signed link
//   2. the frontend window.open()s it; GET /:id/:type checks ?token and serves inline
router.get("/:id/:type/url", authenticate, requireRole("admin", "lead"), ctrl.getDocumentUrl);
router.get("/:id/:type", authenticateOnboardFileToken, ctrl.getContract);
router.post("/request-access", ctrl.onboardAdmin);
export default router;
