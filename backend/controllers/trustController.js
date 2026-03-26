import Vehicle from "../models/Vehicle.js"
import TrustLog from "../models/TrustLog.js"
import { calculateTrust } from "../services/trustService.js"

export const checkTrust = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" })
    }

    const score = calculateTrust(vehicle)

    if (score < 60) {
      await TrustLog.create({
        seller: vehicle.seller,
        vehicle: vehicle._id,
        trustScore: score
      })
    }

    res.json({ trustScore: score })

  } catch (error) {
    res.status(500).json({ message: "Trust calculation failed" })
  }
}