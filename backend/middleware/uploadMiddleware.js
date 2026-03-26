import multer from "multer"
import path from "path"
import { applyWatermark } from "../services/watermarkService.js"

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads/")
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
