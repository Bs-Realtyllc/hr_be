import express from "express";
const router = express.Router();
import { month_end_report, verify, receive } from "../../controllers/webhook.controller";

router.get("/month-end-report", month_end_report);

// Generic per-service inbound webhook receiver, e.g. /webhooks/job_portal/receive.
router.get("/:service/verify", verify);
router.post("/:service/receive", receive);

export default router;
