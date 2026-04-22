import express from "express"
import auth from "../middleware/authMiddleware.js"
import upload from "../middleware/uploadMiddleware.js"
import { protect } from "../middleware/authMiddleware.js"

import {
  getProfile,
  updateProfile,
  toggleFavorite,
  getFavorites,
  changePassword 
} from "../controllers/userController.js"

import User from "../models/User.js"

const router = express.Router()

/* ================= PROFILE ================= */

router.get("/profile", auth, getProfile)

router.put(
  "/profile",
  auth,
  upload.single("profileImage"),
  updateProfile
)


/* ================= FAVORITES ================= */

router.get("/favorites", protect, getFavorites)
router.put("/profile", protect, updateProfile)
router.put("/change-password", protect, changePassword)

import { deleteAccount } from "../controllers/userController.js"
router.delete("/account", protect, deleteAccount)

router.post("/favorite/:vehicleId", auth, toggleFavorite)

/* ================= SELLER PUBLIC PROFILE ================= */

// We use an optional auth check here to allow the owner to see their own private profile
router.get("/:id", async (req, res) => {
  try {
    // Try to get current user from token if present (optional)
    const authHeader = req.headers.authorization;
    let currentUserId = null;
    if (authHeader) {
      try {
        const jwt = (await import("jsonwebtoken")).default;
        const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {
        // invalid token, ignore
      }
    }

    const user = await User.findById(req.params.id)
      .select("-password")

    if (!user)
      return res.status(404).json("User not found")

    // Check privacy settings
    // Allow access if profile is public OR if the requesting user is the owner
    const isOwner = currentUserId && currentUserId === user._id.toString();
    
    if (user.settings?.privacy?.publicProfile === false && !isOwner) {
      return res.status(403).json({ 
        message: "This profile is private",
        isPrivate: true 
      })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json("Failed to fetch seller")
  }
})

export default router