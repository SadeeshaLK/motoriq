import Vehicle from "../models/Vehicle.js"
import { calculateTrustScore } from "../utils/calculateTrustScore.js"
import { predictVehiclePrice, bestDealScore } from "../services/aiPriceService.js"
import { recommendVehicles } from "../services/recommendationService.js"
import mongoose from "mongoose"


/* ================= HELPER: NORMALIZE OPTIONS ================= */
const normalizeOptions = (value) => {

  if (!value) return []

  if (Array.isArray(value)) {
    return value
      .join(",")
      .split(",")
      .map(v => v.trim())
      .filter(v => v !== "")
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(v => v.trim())
      .filter(v => v !== "")
  }

  return []
}



/* ================= CREATE VEHICLE ================= */
export const createVehicle = async (req, res) => {

  try {

    const {
      brand,
      model,
      vehicleType,
      condition,
      manufacturedYear,
      registeredYear,
      maintenanceLevel,
      maintenancePeriod,
      price,
      transmission,
      fuelType,
      engineCapacity,
      mileage,
      options,
      safetyOptions,
      techOptions,
      additionalInfo,
      province,
      district,
      city,
      address,
      location
    } = req.body


    /* Normalize checkbox options */
    const cleanOptions = normalizeOptions(options)
    const cleanSafetyOptions = normalizeOptions(safetyOptions)
    const cleanTechOptions = normalizeOptions(techOptions)


    /* Create vehicleData for trust score calculation */
    const vehicleData = {
      brand,
      model,
      vehicleType,
      condition,
      manufacturedYear,
      registeredYear,
      maintenanceLevel,
      maintenancePeriod,
      price,
      transmission,
      fuelType,
      engineCapacity,
      mileage
    }

    const trustScore = calculateTrustScore(vehicleData)


    /* Fix image paths */
    const images = req.files?.map(
      file => `/uploads/${file.filename}`
    ) || []


    /* Convert location */
    let coordinates = [0, 0]

    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" })
    }

    if (location) {
      const parsed = JSON.parse(location)
      if (parsed.lat && parsed.lng) {
        coordinates = [parsed.lng, parsed.lat]
      }
    }


    const vehicle = await Vehicle.create({
      brand,
      model,
      vehicleType,
      condition,
      manufacturedYear: Number(manufacturedYear),
      registeredYear: registeredYear ? Number(registeredYear) : null,
      maintenanceLevel,
      maintenancePeriod,
      price: Number(price),
      transmission,
      fuelType,
      engineCapacity: engineCapacity ? Number(engineCapacity) : null,
      mileage: mileage ? Number(mileage) : 0,

      /* cleaned arrays */
      options: cleanOptions,
      safetyOptions: cleanSafetyOptions,
      techOptions: cleanTechOptions,

      additionalInfo,
      province,
      district,
      city,
      address,
      images,
      trustScore,
      location: {
        type: "Point",
        coordinates
      },
      user: req.user.id
    })

    res.status(201).json(vehicle)

  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Vehicle creation failed" })
  }
}



/* ================= GET ALL VEHICLES ================= */
export const getAllVehicles = async (req, res) => {
  try {
    console.log("Incoming Query Params:", req.query)

    const vehicles = await Vehicle.find()
      .sort({ createdAt: -1 })

    res.json(vehicles)
  } catch (err) {
    res.status(500).json({ message: "Server Error" })
  }
}


// GET /vehicles/my
export const getMyVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ user: req.user.id })
      .populate("user", "username rating role")

    res.json(vehicles)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch your vehicles" })
  }
}


export const getVehicleById = async (req, res) => {

  try {

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json("Invalid vehicle ID")
    }

    const vehicle = await Vehicle.findById(id)
      .populate("user", "name rating phone")

    if (!vehicle) {
      return res.status(404).json("Vehicle not found")
    }

    /* AI price prediction */
    const predictedPrice = predictVehiclePrice(vehicle)

    /* Best deal score */
    const dealScore = bestDealScore(vehicle)

    res.json({
      ...vehicle.toObject(),
      predictedPrice,
      dealScore
    })

  } catch (error) {

    console.error(error)
    res.status(500).json("Failed to fetch vehicle")

  }

}



/* ================= SEARCH VEHICLES ================= */
export const searchVehicles = async (req, res) => {

  try {

    const {
      brand,
      model,
      vehicleType,
      condition,
      transmission,
      maintenanceLevel,
      fuelType,
      province,
      district,
      city,
      minPrice,
      maxPrice,
      minMileage,
      maxMileage,
      minYear,
      maxYear,
      userLat,
      userLng,
      radius
    } = req.query

    let query = {}

    if (brand) query.brand = brand
    if (model) query.model = model
    if (vehicleType) query.vehicleType = vehicleType
    if (condition) query.condition = condition
    if (transmission) query.transmission = transmission
    if (maintenanceLevel) query.maintenanceLevel = maintenanceLevel
    if (fuelType) query.fuelType = fuelType
    if (province) query.province = province
    if (district) query.district = district
    if (city) query.city = city


    /* Price Filter */
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }


    /* Mileage Filter */
    if (minMileage || maxMileage) {
      query.mileage = {}
      if (minMileage) query.mileage.$gte = Number(minMileage)
      if (maxMileage) query.mileage.$lte = Number(maxMileage)
    }


    /* Year Filter */
    if (minYear || maxYear) {
      query.manufacturedYear = {}
      if (minYear) query.manufacturedYear.$gte = Number(minYear)
      if (maxYear) query.manufacturedYear.$lte = Number(maxYear)
    }


    /* Geo Filter 
    if (userLat && userLng && radius) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [Number(userLng), Number(userLat)],
            Number(radius) / 6378.1
          ]
        }
      }
    }*/


    const vehicles = await Vehicle.find(query)
      .populate("user", "name role rating profileImage")
      .sort({ createdAt: -1 })

    res.json(vehicles)

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server Error" })
  }
}

//DELETE Vehicle

export const deleteVehicle = async (req, res) => {
  try {

    const vehicle = await Vehicle.findById(req.params.id)

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" })
    }

    await Vehicle.findByIdAndDelete(req.params.id)

    res.json({ message: "Vehicle deleted successfully" })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

/* ================= AI RECOMMENDED VEHICLES ================= */

export const getRecommendedVehicles = async (req, res) => {

  try {

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" })
    }

    const vehicle = await Vehicle.findById(id)

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" })
    }

    const vehicles = await Vehicle.find({
      _id: { $ne: id }
    }).limit(30)

    const recommended = vehicles
      .map(v => {

        let score = 0

        if (v.brand === vehicle.brand) score += 3
        if (v.vehicleType === vehicle.vehicleType) score += 2
        if (Math.abs(v.price - vehicle.price) < 500000) score += 2
        if (v.city === vehicle.city) score += 1

        return { vehicle: v, score }

      })
      .sort((a,b) => b.score - a.score)
      .slice(0,6)
      .map(v => v.vehicle)

    res.json(recommended)

  } catch (error) {

    console.error(error)
    res.status(500).json({ message: "Failed to fetch recommendations" })

  }

}

export const updateVehicle = async (req, res) => {

  try {

    const vehicle = await Vehicle.findById(req.params.id)

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" })
    }

    let images = vehicle.images || []

    /* DELETE IMAGES */

    if (req.body.imagesToDelete) {

      const imagesToDelete = JSON.parse(req.body.imagesToDelete)

      images = images.filter(img => !imagesToDelete.includes(img))

    }

    /* ADD NEW IMAGES */

    if (req.files && req.files.length > 0) {

      const newImages = req.files.map(
        file => `/uploads/${file.filename}`
      )

      images = [...images, ...newImages]

    }

    /* REORDER IMAGES */

    if (req.body.imageOrder) {

      const order = JSON.parse(req.body.imageOrder)

      const orderedExisting = order.filter(img => images.includes(img))

      const newUploaded = images.filter(img => !order.includes(img))

      images = [...orderedExisting, ...newUploaded]

    }

    /* UPDATE OTHER FIELDS */

    Object.keys(req.body).forEach(key => {

      if (
        key !== "imagesToDelete" &&
        key !== "imageOrder"
      ) {
        vehicle[key] = req.body[key]
      }

    })

    vehicle.images = images

    await vehicle.save()

    res.json(vehicle)

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Vehicle update failed"
    })

  }

}

export const getVehiclesByUser = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({
      user: req.params.id
    }).populate("user")

    res.json(vehicles)

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to fetch vehicles" })
  }
}
