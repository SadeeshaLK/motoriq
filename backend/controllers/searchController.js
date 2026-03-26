import Vehicle from "../models/Vehicle.js"
import { rankVehicles } from "../services/recommendationService.js"

export const searchVehicles = async (req, res) => {

  try {

    const {
      q,
      brand,
      model,
      vehicleType,
      fuelType,
      condition,
      transmission,
      maintenanceLevel,
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

    const filters = {}

    /* ================= BASIC FILTERS ================= */

    if (brand)
      filters.brand = { $regex: brand, $options: "i" }

    if (model)
      filters.model = { $regex: model, $options: "i" }

    if (vehicleType)
      filters.vehicleType = vehicleType

    if (fuelType)
      filters.fuelType = fuelType

    if (condition)
      filters.condition = condition

    if (transmission)
      filters.transmission = transmission

    if (maintenanceLevel)
      filters.maintenanceLevel = maintenanceLevel

    if (province)
      filters.province = province

    if (district)
      filters.district = district

    if (city)
      filters.city = city


    /* ================= PRICE FILTER ================= */

    if (minPrice || maxPrice) {

      filters.price = {}

      if (minPrice)
        filters.price.$gte = Number(minPrice)

      if (maxPrice)
        filters.price.$lte = Number(maxPrice)

    }


    /* ================= MILEAGE FILTER ================= */

    if (minMileage || maxMileage) {

      filters.mileage = {}

      if (minMileage)
        filters.mileage.$gte = Number(minMileage)

      if (maxMileage)
        filters.mileage.$lte = Number(maxMileage)

    }


    /* ================= YEAR FILTER ================= */

    if (minYear || maxYear) {

      filters.manufacturedYear = {}

      if (minYear)
        filters.manufacturedYear.$gte = Number(minYear)

      if (maxYear)
        filters.manufacturedYear.$lte = Number(maxYear)

    }


    /* ================= DISTANCE FILTER ================= */

    if (
      userLat &&
      userLng &&
      radius &&
      !isNaN(userLat) &&
      !isNaN(userLng)
    ) {

      const distanceInMeters = Number(radius) * 1000

      filters.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              Number(userLng),
              Number(userLat)
            ]
          },
          $maxDistance: distanceInMeters
        }
      }

    }


    /* ================= KEYWORD SEARCH ================= */

    let query = filters

    if (q) {

      query = {
        $and: [
          filters,
          {
            $or: [
              { brand: { $regex: q, $options: "i" } },
              { model: { $regex: q, $options: "i" } },
              { vehicleType: { $regex: q, $options: "i" } },
              { city: { $regex: q, $options: "i" } }
            ]
          }
        ]
      }

    }


    /* ================= EXECUTE QUERY ================= */

    const vehicles = await Vehicle.find(query)
      .populate("user", "name role rating profileImage")


    /* ================= RANKING ================= */

    const ranked = rankVehicles(
      vehicles,
      Number(maxPrice) || null
    )

    res.json(ranked)

  } catch (error) {

    console.log(error)

    res.status(500).json("Search error")

  }

}