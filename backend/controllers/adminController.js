import User from "../models/User.js"
import Vehicle from "../models/Vehicle.js"
import Notification from "../models/Notification.js"
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

    const bannedUsers = await User.countDocuments({ isBanned: true })

    const avgPriceResult = await Vehicle.aggregate([
      { $group: { _id: null, avgPrice: { $avg: "$price" } } }
    ])

    const averagePrice = avgPriceResult[0]?.avgPrice || 0

    const monthlyGrowth = await Vehicle.aggregate([
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])

    // new users in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const newUsersThisWeek = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
    const newVehiclesThisWeek = await Vehicle.countDocuments({ createdAt: { $gte: sevenDaysAgo } })

    res.json({
      totalUsers,
      totalVehicles,
      totalBuyers,
      totalSellers,
      suspiciousListings,
      bannedUsers,
      averagePrice,
      monthlyGrowth,
      newUsersThisWeek,
      newVehiclesThisWeek
    })

  } catch (err) {
    res.status(500).json({ message: "Admin stats failed" })
  }
}

/* GET ALL USERS */
export const getAllUsers = async (req, res) => {
  try {
    const { search, status } = req.query

    let query = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }
    if (status === "banned") query.isBanned = true
    if (status === "admin") query.isAdmin = true

    const users = await User.find(query).select("-password").sort({ createdAt: -1 })

    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const listingsCount = await Vehicle.countDocuments({ user: user._id })
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

/* DELETE USER */
export const deleteUser = async (req, res) => {
  try {
    await Vehicle.deleteMany({ user: req.params.id })
    await Notification.deleteMany({ user: req.params.id })
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "User deleted successfully" })
  } catch (err) {
    res.status(500).json({ message: "Delete failed" })
  }
}

/* TOGGLE ADMIN */
export const toggleAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    user.isAdmin = !user.isAdmin
    await user.save()

    await Notification.create({
      user: user._id,
      type: "system",
      title: user.isAdmin ? "Admin Access Granted" : "Admin Access Revoked",
      text: user.isAdmin
        ? "You have been granted admin privileges on MotorIQ."
        : "Your admin privileges have been revoked.",
      link: "/"
    })

    if (req.io) {
      req.io.to(user._id.toString()).emit("newNotification", {
        type: "system",
        title: user.isAdmin ? "Admin Access Granted" : "Admin Access Revoked",
        text: user.isAdmin ? "You now have admin access." : "Admin access revoked."
      })
    }

    res.json({ message: "Admin status updated", isAdmin: user.isAdmin })
  } catch (err) {
    res.status(500).json({ message: "Update failed" })
  }
}

/* TOGGLE BAN */
export const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    user.isBanned = !user.isBanned
    await user.save()

    await Notification.create({
      user: user._id,
      type: "banned",
      title: user.isBanned ? "Account Suspended" : "Account Restored",
      text: user.isBanned
        ? "Your account has been suspended. Contact support for assistance."
        : "Your account has been restored. Welcome back!",
      link: "/"
    })

    if (req.io) {
      req.io.to(user._id.toString()).emit("newNotification", {
        type: "banned",
        title: user.isBanned ? "Account Suspended" : "Account Restored",
        text: user.isBanned ? "Your account has been suspended." : "Your account is restored."
      })
    }

    res.json({ message: "User ban status updated", isBanned: user.isBanned })
  } catch (err) {
    res.status(500).json({ message: "Ban failed" })
  }
}

/* GET ALL VEHICLES */
export const getAllVehicles = async (req, res) => {
  try {
    const { search, brand } = req.query

    let query = {}
    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } }
      ]
    }
    if (brand) query.brand = brand

    const vehicles = await Vehicle.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })

    res.json(vehicles)
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch vehicles" })
  }
}

/* DELETE VEHICLE */
export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("user", "_id")

    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" })
    }

    // Notify seller
    if (vehicle.user) {
      await Notification.create({
        user: vehicle.user._id,
        type: "alert",
        title: "Listing Removed",
        text: `Your listing "${vehicle.brand} ${vehicle.model}" has been removed by an admin.`,
        link: "/account"
      })

      if (req.io) {
        req.io.to(vehicle.user._id.toString()).emit("newNotification", {
          type: "alert",
          title: "Listing Removed",
          text: `Your listing was removed by an admin.`
        })
      }
    }

    await Vehicle.findByIdAndDelete(req.params.id)

    res.status(200).json({ success: true, message: "Vehicle deleted successfully" })

  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" })
  }
}

/* SEND NOTIFICATION TO SPECIFIC USERS */
export const sendAdminNotification = async (req, res) => {
  try {
    const { userIds, title, text, link, type } = req.body

    if (!userIds?.length || !text) {
      return res.status(400).json({ message: "userIds and text are required" })
    }

    const notifications = userIds.map(userId => ({
      user: userId,
      title: title || "Admin Notification",
      text,
      link: link || "/",
      type: type || "system"
    }))

    await Notification.insertMany(notifications)

    userIds.forEach(userId => {
      if (req.io) {
        req.io.to(userId.toString()).emit("newNotification", { type, title, text, link })
      }
    })

    res.json({ success: true, count: notifications.length })
  } catch (err) {
    res.status(500).json({ message: "Failed to send notifications" })
  }
}

/* GET PENDING BOOSTS */
export const getPendingBoosts = async (req, res) => {
  try {
    const boosts = await Vehicle.find({ boostStatus: "pending" })
      .populate("user", "name email phone")
      .sort({ updatedAt: -1 })
    res.json(boosts)
  } catch(err) {
    res.status(500).json({ message: "Failed to fetch pending boosts" })
  }
}

/* APPROVE BOOST */
export const approveBoost = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
    if(!vehicle) return res.status(404).json({ message: "Vehicle not found" })
    
    vehicle.boostStatus = "active"
    vehicle.isPremium = true
    await vehicle.save()

    // Notify seller
    await Notification.create({
      user: vehicle.user,
      type: "alert",
      title: "Boost Approved! 🌟",
      text: `Your listing "${vehicle.brand} ${vehicle.model}" is now PREMIUM.`,
      link: "/account"
    })

    res.json({ message: "Boost approved", vehicle })
  } catch(err) {
    res.status(500).json({ message: "Failed to approve boost" })
  }
}

/* REJECT BOOST */
export const rejectBoost = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
    if(!vehicle) return res.status(404).json({ message: "Vehicle not found" })
    
    vehicle.boostStatus = "rejected"
    vehicle.isPremium = false
    await vehicle.save()

    // Notify seller
    await Notification.create({
      user: vehicle.user,
      type: "alert",
      title: "Boost Rejected",
      text: `Your boost request for "${vehicle.brand} ${vehicle.model}" was rejected. Please contact support.`,
      link: "/account"
    })

    res.json({ message: "Boost rejected", vehicle })
  } catch(err) {
    res.status(500).json({ message: "Failed to reject boost" })
  }
}