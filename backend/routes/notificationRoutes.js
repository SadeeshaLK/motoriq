import express from "express"
import Notification from "../models/Notification.js"
import auth from "../middleware/authMiddleware.js"

const router = express.Router()

/* GET USER NOTIFICATIONS (with pagination) */
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 30

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      read: false
    })

    res.json({ notifications, unreadCount })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

/* MARK SINGLE AS READ */
router.put("/read/:id", auth, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

/* MARK ALL AS READ */
router.put("/read-all", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

/* DELETE SINGLE NOTIFICATION */
router.delete("/:id", auth, async (req, res) => {
  try {
    await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

/* DELETE ALL NOTIFICATIONS */
router.delete("/", auth, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

/* ADMIN — SEND BROADCAST NOTIFICATION */
router.post("/broadcast", auth, async (req, res) => {
  try {
    const { userIds, title, text, link, type } = req.body

    const notifications = userIds.map(userId => ({
      user: userId,
      title: title || "System Notification",
      text,
      link: link || "/",
      type: type || "system"
    }))

    const created = await Notification.insertMany(notifications)

    // Emit to all users via socket
    userIds.forEach(userId => {
      req.io.to(userId.toString()).emit("newNotification", {
        title,
        text,
        link,
        type
      })
    })

    res.json({ success: true, count: created.length })
  } catch (err) {
    res.status(500).json({ message: "Broadcast failed" })
  }
})

export default router