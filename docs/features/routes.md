---
import express from 'express';
import * as ctrl from '../../controllers/onboard.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { upload } from '../../middleware/uplod';

const router = express.Router();

router.get("/", authenticate, requireRole('admin'), ctrl.list);
router.post(
  "/",
  upload.fields([
    { name: "contract", maxCount: 1 },
    { name: "citizenshipFront", maxCount: 1 },
    { name: "citizenshipBack", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "passoutCertificate", maxCount: 1 },
    { name: "passportPhoto", maxCount: 1 },
  ]),
  ctrl.add,
);
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("lead", "admin"),
  ctrl.approve,
);
router.delete("/:id", authenticate, requireRole("lead", "admin"), ctrl.remove);

// route
router.get("/:id/:type", authenticate, requireRole("admin", "lead"), ctrl.getContract);

export default router;
