import express from "express";
const router = express.Router();
import { month_end_report } from "../../controllers/webhook.controller";

router.get("/month-end-report", month_end_report);


export default router;
