import express from "express";
import * as ctrl from "../../controllers/onboard.controller";
import { authenticate, requireRole } from "../../middleware/auth";
import { upload } from "../../middleware/uplod";
const router = express.Router();

router.get("/", authenticate, ctrl.list);
router.post("/", upload.single("contract"), ctrl.add);
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("lead", "admin"),
  ctrl.approve,
);
router.delete("/:id", authenticate, requireRole("lead", "admin"), ctrl.remove);

// route
router.get("/:id/contract", authenticate, ctrl.getContract);

export default router;
