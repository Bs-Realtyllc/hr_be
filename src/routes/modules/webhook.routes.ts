import express from "express";
const router = express.Router();
import { month_end_report } from "../../controllers/webhook.controller";

router.get("/month-end-report", month_end_report);
// router.post("/webhook-test", (req, res) => {
//   console.log("webhook called.");
//   console.log(req.body)
//   res.status(200).json({ message: "Test sucessfull" });
// });

export default router;
