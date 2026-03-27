import User from "../models/User.js"
import Vehicle from "../models/Vehicle.js"
import bcrypt from "bcryptjs"


/* GET PROFILE */
export const getProfile = async (req, res) => {
  try {

    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("favorites")

    res.json(user)

  } catch (error) {
    res.status(500).json("Failed to fetch profile")
  }
}

// PUT /users/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)

    if (!isMatch) {
      return res.status(400).json({ message: "Current password incorrect" })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)

    await user.save()

    res.json({ message: "Password changed successfully" })

  } catch (error) {
    res.status(500).json({ message: "Password change failed" })
  }
}

// PUT /users/profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.phone = req.body.phone || user.phone
    user.city = req.body.city || user.city

    await user.save()

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        city: user.city
      }
    })

  } catch (error) {
    res.status(500).json({ message: "Profile update failed" })
  }
}

export const toggleFavorite = async (req, res) => {

  const user = await User.findById(req.user.id)

  const vehicleId = req.params.vehicleId

  const exists = user.favorites.includes(vehicleId)

  if (exists) {
    user.favorites = user.favorites.filter(
      id => id.toString() !== vehicleId
    )
  } else {
    user.favorites.push(vehicleId)
  }

  await user.save()

  res.json(user.favorites)
}

// GET /users/favorites
export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: "favorites",
        populate: { path: "user", select: "username rating role" }
      })

    res.json(user.favorites)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch favorites" })
  }
}

