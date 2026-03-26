import express from "express"
import { getEstimatedPrice } from "../controllers/priceController.js"

const router = express.Router()

router.get("/:id", getEstimatedPrice)

export default router