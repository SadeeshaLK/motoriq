import express from "express"
import { createReview, getVehicleReviews } from "../controllers/reviewController.js"
import auth from "../middleware/authMiddleware.js"

const router = express.Router()

/* GET REVIEWS FOR VEHICLE */
router.get("/:vehicleId", getVehicleReviews)

/* ADD REVIEW */
router.post("/:vehicleId", auth, createReview)

export default router
