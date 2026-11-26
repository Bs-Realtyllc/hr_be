import express from "express";
import * as ctrl from "../../controllers/orgChart.controller";
import { authenticate } from "../../middleware/auth";

const router = express.Router();

// Visible to every logged-in employee.
router.get("/", authenticate, ctrl.get);

export default router;
