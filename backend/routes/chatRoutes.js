import express from "express"
import {
  getChat,
  sendMessage,
  getUserChats,
  markAsRead,
  markAllRead,
  deleteChat,
  deleteMessage
} from "../controllers/chatController.js"
import auth from "../middleware/authMiddleware.js"
import upload from "../middleware/uploadMiddleware.js"

const router = express.Router()

router.get("/", auth, getUserChats)
router.get("/:vehicleId/:sellerId",auth,getChat)
router.post("/:chatId", auth, upload.single("image"), sendMessage)
router.put(
  "/read/:chatId/:messageId",
  auth,
  markAsRead
)
router.put("/read-all/:chatId", auth, markAllRead)
router.delete("/:chatId", auth, deleteChat)
router.delete("/:chatId/message/:messageId", auth, deleteMessage)

export default router
