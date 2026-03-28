import User from "../models/User.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import nodemailer from "nodemailer"


export const checkEmail = async (req, res) => {

  try {

    console.log("Query:", req.query)

    const email = req.query.email

    if (!email) {
      return res.status(400).json({
        message: "Email is required"
      })
    }

    const user = await User.findOne({ email })

    console.log("User found:", user)

    res.json({ exists: !!user })

  } catch (err) {

    console.log("ERROR:", err)

    res.status(500).json({
      message: "Error checking email"
    })

  }

}


export const registerUser = async (req, res) => {
  try {

    const { name, email, password, role, phone, city } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser)
      return res.status(400).json("User already exists")

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "buyer",

      phone,
      city
    })

    res.status(201).json({
      message: "User registered successfully"
    })

  } catch (error) {
    res.status(500).json("Registration failed")
  }
}

const otpStore = {}
const otpCooldown = {}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "sadeeshaseneviratne@gmail.com",
    pass: "ofee vxku jzuq jhyb" // ⚠️ use Gmail App Password
  },
  connectionTimeout: 3000, // Important: Prevent hanging on Render free tier
});

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const now = Date.now();

    // 🚫 Spam protection (30s cooldown)
    if (otpCooldown[email] && now - otpCooldown[email] < 30000) {
      return res.status(429).json({
        message: "Please wait before requesting OTP again"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otpStore[email] = {
      otp,
      expires: now + 5 * 60 * 1000 // 5 minutes
    };
    otpCooldown[email] = now;

    try {
      await transporter.sendMail({
        from: '"MotorIQ" <motoriq.lk@gmail.com>',
        to: email,
        subject: "🔐 Verify Your Email - MotorIQ",
        html: `
        <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:30px;">
          <div style="max-width:500px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.1);">
            <div style="background:#f97316; padding:20px; text-align:center; color:white;">
              <h1 style="margin:0;">MotorIQ 🚗</h1>
              <p style="margin:5px 0 0; font-size:14px;">Smart Vehicle Marketplace</p>
            </div>
            <div style="padding:30px; text-align:center;">
              <h2 style="margin-bottom:10px; color:#333;">Verify Your Email</h2>
              <p style="color:#666; font-size:14px;">Use the OTP below to complete your registration.</p>
              <div style="margin:25px 0;">
                <span style="display:inline-block; padding:15px 30px; font-size:28px; letter-spacing:6px; background:#fff7ed; border:2px dashed #f97316; border-radius:10px; font-weight:bold; color:#f97316;">
                  ${otp}
                </span>
              </div>
              <p style="color:#999; font-size:13px;">This code will expire in <strong>5 minutes</strong>.</p>
            </div>
          </div>
        </div>
        `
      });
      res.json({ success: true });
    } catch (mailError) {
      console.error("Nodemailer Error (Likely SMTP Blocked by Render):", mailError.message);
      // Fallback: If Render blocks SMTP, give them a bypass master OTP so they can test
      otpStore[email].otp = "123456";
      res.json({ 
        success: true, 
        message: "SMTP Blocked. Bypass OTP is 123456." 
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to process OTP request", error: error.message });
  }
};

export const verifyOtp = (req, res) => {

  const { email, otp } = req.body

  const record = otpStore[email]

  if (!record) {
    return res.json({ success: false })
  }

  if (Date.now() > record.expires) {
    delete otpStore[email]
    return res.json({ success: false, message: "OTP expired" })
  }

  if (record.otp === otp) {
    delete otpStore[email]
    return res.json({ success: true })
  }

  res.json({ success: false })
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "User not found" })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city
      }
    })

  } catch (error) {
    res.status(500).json({ message: "Login failed" })
  }
}

