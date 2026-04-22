import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["message", "system", "alert", "price", "favorite", "banned", "vehicle_approved"],
    default: "system"
  },

  title: {
    type: String,
    default: "Notification"
  },

  text: {
    type: String,
    required: true
  },

  link: {
    type: String,
    default: "/inbox"
  },

  read: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
})

export default mongoose.model("Notification", notificationSchema)