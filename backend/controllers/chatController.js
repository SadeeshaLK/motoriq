import Chat from "../models/Chat.js"
import Notification from "../models/Notification.js"
import { v2 as cloudinary } from "cloudinary"
import streamifier from "streamifier"

/* CREATE OR GET CHAT */
export const getChat = async (req, res) => {
  try {
    const { vehicleId, sellerId } = req.params

    let chat = await Chat.findOne({
      vehicle: vehicleId,
      users: { $all: [req.user._id, sellerId] }
    })
      .populate("users", "name email")
      .populate("vehicle", "brand model images price")

    if (!chat) {
      chat = await Chat.create({
        vehicle: vehicleId,
        users: [req.user._id, sellerId],
        messages: []
      })
      chat = await Chat.findById(chat._id)
        .populate("users", "name email")
        .populate("vehicle", "brand model images price")
    }

    res.json(chat)
  } catch (err) {
    console.error("getChat error:", err)
    res.status(500).json({ message: "Failed to get or create chat", error: err.message })
  }
}

/* SEND MESSAGE (text + optional image + optional reply) */
export const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params
    const { text, image, replyTo } = req.body

    const chat = await Chat.findById(chatId)
    if (!chat) return res.status(404).json({ message: "Chat not found" })

    // Handle image upload from base64 if provided
    // Handle image upload from multer diskStorage
    let imageUrl = image || null
    if (req.file) {
      imageUrl = req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename
    }

    let parsedReplyTo = null
    if (replyTo) {
      try {
        parsedReplyTo = typeof replyTo === 'string' ? JSON.parse(replyTo) : (replyTo || null)
      } catch (e) {
        console.error("Failed to parse replyTo", e)
      }
    }

    const message = {
      sender: req.user.id,
      text: text || "",
      image: imageUrl,
      replyTo: parsedReplyTo,
      createdAt: new Date(),
      readBy: [req.user.id]
    }

    chat.messages.push(message)
    await chat.save()

    // Get the saved message (with _id from MongoDB)
    const savedMsg = chat.messages[chat.messages.length - 1]

    const receiver = chat.users.find(
      u => String(u) !== String(req.user.id)
    )

    try {
      const notification = await Notification.create({
        user: receiver,
        text: "📩 New message received",
        link: "/inbox"
      })
      req.io.to(receiver.toString()).emit("newNotification", notification)
    } catch (e) {
      // Notification creation not critical
    }

    res.json({
      message: savedMsg,
      messages: chat.messages
    })
  } catch (err) {
    console.error("sendMessage error:", err)
    res.status(500).json({ message: "Failed to send message", error: err.message })
  }
}

/* GET ALL CHATS FOR A USER */
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      users: { $in: [req.user.id] }
    })
      .populate("users", "name email")
      .populate("vehicle", "brand model images price")
      .sort({ updatedAt: -1 })

    res.json(chats)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to fetch chats" })
  }
}

/* MARK SINGLE MESSAGE READ */
export const markAsRead = async (req, res) => {
  try {
    const { chatId, messageId } = req.params
    const chat = await Chat.findById(chatId)
    if (!chat) return res.status(404).json({ message: "Chat not found" })

    const message = chat.messages.id(messageId)
    if (!message) return res.status(404).json({ message: "Message not found" })

    if (!message.readBy) message.readBy = []
    if (!message.readBy.map(String).includes(String(req.user.id))) {
      message.readBy.push(req.user.id)
    }

    await chat.save()

    global.io.to(chatId).emit("messagesRead", {
      messageId,
      userId: req.user.id
    })

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to mark read" })
  }
}

/* MARK ALL MESSAGES READ */
export const markAllRead = async (req, res) => {
  try {
    const { chatId } = req.params
    const userId = req.user.id

    const chat = await Chat.findById(chatId)
    if (!chat) return res.status(404).json({ message: "Chat not found" })

    let changed = false
    chat.messages.forEach(m => {
      const senderId = typeof m.sender === "object" ? m.sender._id : m.sender
      if (String(senderId) !== String(userId)) {
        if (!m.readBy.map(String).includes(String(userId))) {
          m.readBy.push(userId)
          changed = true
        }
      }
    })

    if (changed) {
      await chat.save()
    }

    global.io.to(chatId).emit("messagesRead", { userId })

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed" })
  }
}
