import mongoose from "mongoose"

const trustLogSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle"
    },
    trustScore: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
)

const TrustLog = mongoose.model("TrustLog", trustLogSchema)

export default TrustLog