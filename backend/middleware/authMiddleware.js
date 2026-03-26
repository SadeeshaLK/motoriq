import jwt from "jsonwebtoken"
import User from "../models/User.js"

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization

    if (!token) {
      return res.status(401).json({ message: "Not authorized" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select("-password")

    req.user = user

    // 🔥 UPDATE LAST LOGIN (SAFE)
    if (user) {
      await User.findByIdAndUpdate(user._id, {
        lastLogin: new Date()
      })
    }

    next()
  } catch (error) {
    res.status(401).json({ message: "Token failed" })
  }
}

export const adminOnly = (req, res, next) => {
  if (req.user.email !== "admin@motoriq.lk") {
    return res.status(403).json({ message: "Admin access only" })
  }
  next()
}

export default async function auth(req, res, next) {

  const token = req.header("Authorization")

  if (!token)
    return res.status(401).json("No token")

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    req.user = await User.findById(decoded.id)

    next()

  } catch {
    res.status(401).json("Invalid token")
  }
}