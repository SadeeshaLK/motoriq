import express from "express"
import { protect } from "../middleware/authMiddleware.js"
import auth from "../middleware/authMiddleware.js"
import upload, { processWatermark } from "../middleware/uploadMiddleware.js"

import {
  createVehicle,
  searchVehicles,
  getAllVehicles,
  getMyVehicles,
  getVehicleById,
  getRecommendedVehicles,
  deleteVehicle,
  updateVehicle,
  getVehiclesByUser
} from "../controllers/vehicleController.js"

const router = express.Router()

router.get("/my", protect, getMyVehicles)

router.post(
  "/",
  auth,
  upload.array("images", 6),
  processWatermark,
  createVehicle
)

router.get("/search", searchVehicles)

router.get("/", getAllVehicles)

router.get("/recommend/:id", getRecommendedVehicles)

router.get("/:id", getVehicleById)

router.delete("/:id", deleteVehicle)

router.get("/user/:id", getVehiclesByUser)

/* UPDATE VEHICLE */
router.put(
  "/:id",
  auth,
  upload.array("images", 6),
  processWatermark,
  updateVehicle
)

export default router