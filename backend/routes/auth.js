import express from "express"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { checkEmail, login, registerUser, sendOtp, verifyOtp } from "../controllers/authController.js"

const router = express.Router()

router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtp)

router.get("/check-email", checkEmail)

router.post("/login", login)
router.post("/register", registerUser)

export default router