import express from "express";
import * as ctrl from "../../controllers/department.controller";
import { authenticate, requireRole } from "../../middleware/auth";

const router = express.Router();

router.get("/", authenticate, ctrl.list);
router.put("/:id/head", authenticate, requireRole("admin"), ctrl.setHead);

export default router;
