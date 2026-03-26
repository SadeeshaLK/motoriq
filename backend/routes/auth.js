import express from "express"
import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { checkEmail } from "../controllers/authController.js"
import { sendOtp, verifyOtp } from "../controllers/authController.js"

const router = express.Router()

router.post("/send-otp", sendOtp)
router.post("/verify-otp", verifyOtp)

router.get("/check-email", checkEmail)

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: "User not found" })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ message: "Invalid password" })

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    })

  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body

  const hashed = await bcrypt.hash(password, 10)

  const user = await User.create({
    name,
    email,
    password: hashed
  })

  res.json(user)
})

export default router