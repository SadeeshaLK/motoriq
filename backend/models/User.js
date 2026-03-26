import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    //role: {
    //  type: String,
    //  enum: ["buyer", "seller"],
    //  default: "buyer"
    //},

    phone: {
  type: String
},

city: {
  type: String
},
    bio: String,
    location: String,
    profileImage: String,

    otp: String,
    otpExpires: Date,

    //rating: {
    //  type: Number,
    //  default: 5
    //},

    totalReviews: {
      type: Number,
      default: 0
    },
    
    lastLogin: {
    type: Date
    },

    favorites: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vehicle"
  }
]

  },
  { timestamps: true }
)

export default mongoose.model("User", userSchema)