import express from "express"
import { checkTrust } from "../controllers/trustController.js"

const router = express.Router()

router.get("/:id", checkTrust)

export default router