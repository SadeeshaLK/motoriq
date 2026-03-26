import mongoose from "mongoose"

const vehicleSchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    brand: { type: String, required: true },
    model: { type: String, required: true },
    vehicleType: { type: String, required: true },
    condition: { type: String, required: true },

    /* YEARS */
    manufacturedYear: { type: Number, required: true },
    registeredYear: Number,

    maintenanceLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    maintenancePeriod: {
      type: String,
      enum: ["3 months", "6 months", "1 year"],
      default: "6 months"
     },

    /* PRICING */
    price: { type: Number, required: true },

    /* TECHNICAL */
    transmission: String,
    fuelType: String,
    engineCapacity: Number,
    mileage: { type: Number, default: 0 },

    trustScore: {
    type: Number,
    default: 50
    },

    /* FEATURES */
    options: {
    type: [String],
    default: []
    },

    safetyOptions: {
    type: [String],
    default: []
    },

    techOptions: {
    type: [String],
    default: []
    },

    additionalInfo: String,

    /* LOCATION */
    province: String,
    district: String,
    city: String,
    address: String,

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0]
      }
    },

    /* MEDIA */
    images: [{ type: String }],

    /* USER */
    user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
    }

  },
  { timestamps: true }
)

/* Geo Index */
vehicleSchema.index({ location: "2dsphere" })

export default mongoose.model("Vehicle", vehicleSchema)