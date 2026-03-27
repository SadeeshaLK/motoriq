import express from "express";
import { registerUser, login, checkEmail, sendOtp, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

router.get("/check-email", checkEmail);
router.post("/register", registerUser);
router.post("/login", login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

export default router;