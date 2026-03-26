import express from "express"
import {
  getChat,
  sendMessage,
  getUserChats,
  markAsRead,
  markAllRead
} from "../controllers/chatController.js"
import auth from "../middleware/authMiddleware.js"

const router = express.Router()

router.get("/", auth, getUserChats)
router.get("/:vehicleId/:sellerId",auth,getChat)
router.post("/:chatId",auth,sendMessage)
router.put(
  "/read/:chatId/:messageId",
  auth,
  markAsRead
)
router.put("/read-all/:chatId", auth, markAllRead)

export default router
