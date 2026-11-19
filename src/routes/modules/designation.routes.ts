import express from "express";
import * as ctrl from "../../controllers/designation.controller";
import { authenticate } from "../../middleware/auth";

const router = express.Router();

router.get("/", authenticate, ctrl.list);

export default router;
