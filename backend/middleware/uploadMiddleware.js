import multer from "multer"
import path from "path"
import { applyWatermark } from "../services/watermarkService.js"

import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadDir = path.join(__dirname, "..", "uploads")

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },

  filename: (req, file, cb) => {

    const unique =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9)

    cb(null, unique + path.extname(file.originalname))
  }

})

const upload = multer({ storage })

export const uploadVehicleImages = upload.array("images", 10)

export const processWatermark = async (req, res, next) => {

  if (!req.files) return next()

  for (const file of req.files) {
    await applyWatermark(file.path)
  }

  next()
}

export default upload
