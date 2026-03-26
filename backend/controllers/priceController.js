import Vehicle from "../models/Vehicle.js"

// Simple AI price estimation logic
export const getEstimatedPrice = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" })
    }

    // Simple estimation formula example
    const depreciation = 0.05 * (2025 - vehicle.year)
    const estimatedPrice = vehicle.price - (vehicle.price * depreciation)

    res.json({
      listedPrice: vehicle.price,
      estimatedPrice: Math.round(estimatedPrice)
    })

  } catch (error) {
    res.status(500).json({ message: "Price estimation failed" })
  }
}