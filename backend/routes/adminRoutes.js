import express from "express"
import {
  getAdminStats,
  getAllUsers,
  deleteUser,
  toggleAdmin,
  toggleBanUser,
  getAllVehicles,
  deleteVehicle,
  sendAdminNotification
} from "../controllers/adminController.js"

import { protect, adminOnly } from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/stats", protect, adminOnly, getAdminStats)

// USER MANAGEMENT
router.get("/users", protect, adminOnly, getAllUsers)
router.delete("/users/:id", protect, adminOnly, deleteUser)
router.put("/users/admin/:id", protect, adminOnly, toggleAdmin)
router.put("/users/ban/:id", protect, adminOnly, toggleBanUser)

// VEHICLE MANAGEMENT
router.get("/vehicles", protect, adminOnly, getAllVehicles)
router.delete("/vehicles/:id", protect, adminOnly, deleteVehicle)

// NOTIFICATIONS
router.post("/notify", protect, adminOnly, sendAdminNotification)

export default router