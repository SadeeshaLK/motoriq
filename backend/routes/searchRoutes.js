import express from "express"
import { searchVehicles } from "../controllers/searchController.js"

const router = express.Router()

router.get("/", searchVehicles)

export default router