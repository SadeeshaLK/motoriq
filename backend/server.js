import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import cors from "cors"
import http from "http"
import { Server } from "socket.io"
import path from "path"
import { fileURLToPath } from "url"
import authRoutes from "./routes/auth.js"
import vehicleRoutes from "./routes/vehicleRoutes.js"
import priceRoutes from "./routes/priceRoutes.js"
import trustRoutes from "./routes/trustRoutes.js"
import searchRoutes from "./routes/searchRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import adminRoutes from "./routes/adminRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"

dotenv.config()

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Middleware
app.use(cors())
app.use(express.json())
app.use((req,res,next)=>{
  req.io = io
  next()
})

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err))


/* CREATE HTTP SERVER */
const server = http.createServer(app)

/* ================= SOCKET.IO ================= */

const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

global.io = io

io.on("connection",(socket)=>{

  console.log("User connected:", socket.id)

  socket.on("joinChat",(chatId)=>{
    socket.join(chatId)
  })

  socket.on("sendMessage",({chatId,message})=>{
    io.to(chatId).emit("receiveMessage",message)

    socket.to(chatId).emit("newNotification",{
    text:"New message received",
    link:`/chat/${chatId}`
  })
  })

  socket.on("typing",(data)=>{
    socket.to(data.chatId).emit("typing",data)
  })

  socket.on("messageRead",({chatId,messageId,userId})=>{
  io.to(chatId).emit("messageRead",{messageId,userId})
})

})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/vehicles", vehicleRoutes)
app.use("/api/price", priceRoutes)
app.use("/api/trust", trustRoutes)
app.use("/api/search", searchRoutes)
app.use("/api/users", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/reviews", reviewRoutes)
app.use("/api/chat", chatRoutes)
app.use("/api/notifications", notificationRoutes)

// Default route
app.get("/", (req, res) => {
  res.send("MotorIQ API Running 🚗")
})

// Server start
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})