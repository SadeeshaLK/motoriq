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

router.post("/favorite/:vehicleId", auth, toggleFavorite)

/* ================= SELLER PUBLIC PROFILE ================= */

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")

    if (!user)
      return res.status(404).json("User not found")

    res.json(user)
  } catch (error) {
    res.status(500).json("Failed to fetch seller")
  }
})

export default router