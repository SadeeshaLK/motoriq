import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  text: String,
  image: String,           // attachment image URL (cloudinary)
  replyTo: {
    _id: mongoose.Schema.Types.ObjectId,
    text: String,
    senderName: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]
})

const chatSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  messages: [messageSchema]
}, {
  timestamps: true
})

export default mongoose.model("Chat", chatSchema)
