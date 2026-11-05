import express from "express";
import * as ctrl from "../../controllers/onboard.controller";
import { authenticate, requireRole } from "../../middleware/auth";
import { uploadOnboardDocuments } from "../../middleware/uplod";
const router = express.Router();

router.get("/", authenticate, requireRole('admin'), ctrl.list);

// Public lookup so the onboarding form can pre-fill itself — same unauthenticated
// surface as the POST below, since the candidate isn't logged in when they land here.
router.get("/draft", ctrl.getDraft);
// Submitted by the /onboard/:role form — documents are saved under uploads/ by multer
router.post("/", uploadOnboardDocuments, ctrl.add);
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("lead", "admin"),
  ctrl.approve,
);
router.delete("/:id", authenticate, requireRole("lead", "admin"), ctrl.remove);

// :type is a document field name (citizenshipFront, panBack, signedContract, ...) or a legacy alias
router.get("/:id/:type", authenticate, requireRole("admin", "lead"), ctrl.getContract);
router.post("/request-access", ctrl.onboardAdmin);
export default router;
