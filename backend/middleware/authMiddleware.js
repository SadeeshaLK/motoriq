import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const protect = async (req, res, next) => {
  try {
    const token = req.header("Authorization") || req.headers.authorization

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = user

    // 🔥 UPDATE LAST LOGIN (SAFE)
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date()
    })

    next()
  } catch (error) {
    console.error("Auth Error:", error.message)
    res.status(401).json({ message: "Not authorized, token failed" })
  }
}

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.email !== "admin@motoriq.lk") {
    return res.status(403).json({ message: "Admin access only" })
  }
  next()
}

// Default export for backward compatibility
const auth = protect
export default auth