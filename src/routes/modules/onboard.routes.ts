import express from "express";
import * as ctrl from "../../controllers/onboard.controller";
import { authenticate, requireRole } from "../../middleware/auth";
const router = express.Router();

router.get("/", authenticate, ctrl.list);
router.post("/", ctrl.add);
router.patch(
  "/:id/approve",
  authenticate,
  requireRole("lead", "admin"),
  ctrl.approve,
);
router.delete("/:id", authenticate, requireRole("lead", "admin"), ctrl.remove);

export default router;
