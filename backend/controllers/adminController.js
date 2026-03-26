import User from "../models/User.js"
import Vehicle from "../models/Vehicle.js"
import mongoose from "mongoose"

export const getAdminStats = async (req, res) => {
  try {

    const totalUsers = await User.countDocuments()
    const totalVehicles = await Vehicle.countDocuments()

    const sellers = await Vehicle.distinct("user")
    const totalSellers = sellers.length
    const totalBuyers = totalUsers - totalSellers

    const suspiciousListings = await Vehicle.countDocuments({
      trustScore: { $lt: 40 }
    })

    const avgPriceResult = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          avgPrice: { $avg: "$price" }
        }
      }
    ])

    const averagePrice = avgPriceResult[0]?.avgPrice || 0

    const monthlyGrowth = await Vehicle.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])

    res.json({
      totalUsers,
      totalVehicles,
      totalBuyers,
      totalSellers,
      suspiciousListings,
      averagePrice,
      monthlyGrowth
    })

  } catch (err) {
    res.status(500).json({ message: "Admin stats failed" })
  }
}

//////////////////////////////////////////////////////////////
// 🔥 ADMIN CRUD BELOW (ADDED — NOTHING REMOVED)
//////////////////////////////////////////////////////////////

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password")

    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const listingsCount = await Vehicle.countDocuments({
          user: user._id
        })

        return {
          ...user._doc,
          listingsCount,
          trustScore: user.trustScore || 50,
          lastLogin: user.lastLogin || null
        }
      })
    )

    res.json(usersWithDetails)

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" })
  }
}

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    await Vehicle.deleteMany({ user: req.params.id })
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "User deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: "Delete failed" })
  }
}

// TOGGLE ADMIN
export const toggleAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    user.isAdmin = !user.isAdmin
    await user.save()
    res.json({ message: "Admin status updated" })
  } catch (err) {
    res.status(500).json({ message: "Update failed" })
  }
}

// TOGGLE BAN
export const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    user.isBanned = !user.isBanned
    await user.save()
    res.json({ message: "User ban status updated" })
  } catch (err) {
    res.status(500).json({ message: "Ban failed" })
  }
}

// GET ALL VEHICLES
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find().populate("user", "username email")
    res.json(vehicles)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vehicles" })
  }
}

// DELETE VEHICLE
export const deleteVehicle = async (req, res) => {
  try {

    const vehicle = await Vehicle.findById(req.params.id)

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      })
    }

    await Vehicle.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully"
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Delete failed"
    })
  }
}