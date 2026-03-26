export const calculateMonthlyCost = (vehicle) => {

// ---------------- FUEL PRICE BY TYPE ----------------

let fuelPrice = 365

switch (vehicle.fuelType) {
  case "petrol":
    fuelPrice = 365
    break
  case "diesel":
    fuelPrice = 400
    break
  case "hybrid":
    fuelPrice = 365
    break
  case "electric":
    fuelPrice = 65 // LKR per kWh
    break
  default:
    fuelPrice = 420
}


// ---------------- MONTHLY DISTANCE ----------------

let monthlyDistance = 1500

if (vehicle.engineCapacity <= 1300) {
  monthlyDistance = 1600
} else if (vehicle.engineCapacity <= 2000) {
  monthlyDistance = 1400
} else {
  monthlyDistance = 1200
}


// ---------------- ESTIMATED FUEL EFFICIENCY ----------------

let efficiency = vehicle.fuelEfficiency

if (!efficiency) {

  if (vehicle.fuelType === "electric") {

    // km per kWh
    efficiency = 6

  } else if (vehicle.fuelType === "hybrid") {

    if (vehicle.engineCapacity <= 1500) efficiency = 25
    else if (vehicle.engineCapacity <= 2000) efficiency = 20
    else efficiency = 16

  } else if (vehicle.fuelType === "diesel") {

    if (vehicle.engineCapacity <= 1500) efficiency = 20
    else if (vehicle.engineCapacity <= 2000) efficiency = 17
    else efficiency = 14

  } else {

    // petrol
    if (vehicle.engineCapacity <= 1300) efficiency = 16
    else if (vehicle.engineCapacity <= 1800) efficiency = 13
    else if (vehicle.engineCapacity <= 2500) efficiency = 10
    else efficiency = 8

  }

}


// ---------------- FUEL COST ----------------

let fuelCost = 0

if (vehicle.fuelType === "electric") {

  const kwhUsed = monthlyDistance / efficiency
  fuelCost = kwhUsed * fuelPrice

} else {

  const litersUsed = monthlyDistance / efficiency
  fuelCost = litersUsed * fuelPrice

}


// ---------------- MAINTENANCE ----------------

let serviceCost = 0

switch (vehicle.maintenanceLevel) {
  case "low":
    serviceCost = 27500
    break
  case "medium":
    serviceCost = 40000
    break
  case "high":
    serviceCost = 75000
    break
  default:
    serviceCost = 27500
}


// maintenance period (months)
let maintenancePeriod = 12

switch (vehicle.maintenancePeriod) {
  case "6 months":
    maintenancePeriod = 6
    break
  case "1 year":
    maintenancePeriod = 12
    break
  case "3 months":
    maintenancePeriod = 3
    break
  default:
    maintenancePeriod = 12
}


// convert to monthly maintenance cost
const maintenanceCost = Math.round(serviceCost / maintenancePeriod)


// ---------------- MILEAGE WEAR ----------------

let wearCost = 0

if (vehicle.mileage > 180000) wearCost = 7000
else if (vehicle.mileage > 120000) wearCost = 4500
else if (vehicle.mileage > 80000) wearCost = 2500
else if (vehicle.mileage > 40000) wearCost = 1200
else wearCost = 500


// ---------------- ENGINE SERVICE COST ----------------

let engineServiceCost = 0

if (vehicle.engineCapacity <= 1300) engineServiceCost = 1500
else if (vehicle.engineCapacity <= 2000) engineServiceCost = 3000
else engineServiceCost = 5000


// ---------------- VEHICLE AGE ----------------

let ageCost = 0

if (vehicle.manufacturedYear) {
  const currentYear = new Date().getFullYear()
  const age = currentYear - vehicle.manufacturedYear

  if (age > 15) ageCost = 6000
  else if (age > 10) ageCost = 4000
  else if (age > 5) ageCost = 2000
  else ageCost = 500
}


// ---------------- BRAND RELIABILITY ----------------

let reliabilityCost = 0

const reliableBrands = ["Toyota", "Honda", "Suzuki"]
const mediumBrands = ["Nissan", "Mazda", "Mitsubishi"]

if (reliableBrands.includes(vehicle.brand)) {
  reliabilityCost = 500
} else if (mediumBrands.includes(vehicle.brand)) {
  reliabilityCost = 1500
} else {
  reliabilityCost = 3000
}


// ---------------- SPARE PART PRICE ----------------

let sparePartsCost = 0

const expensiveBrands = ["BMW", "Mercedes", "Audi", "Land Rover"]

if (expensiveBrands.includes(vehicle.brand)) {
  sparePartsCost = 6000
} else {
  sparePartsCost = 2000
}


// ---------------- HYBRID BATTERY RISK ----------------

let hybridBatteryCost = 0

if (vehicle.fuelType === "hybrid") {

  const currentYear = new Date().getFullYear()
  const age = currentYear - vehicle.year

  if (age > 8 || vehicle.mileage > 150000) {
    hybridBatteryCost = 5000
  } else {
    hybridBatteryCost = 1500
  }

}


// ---------------- VEHICLE TYPE COST ----------------

let vehicleTypeCost = 0

if (vehicle.bodyType === "SUV") {
  vehicleTypeCost = 2500
} else if (vehicle.bodyType === "Pickup") {
  vehicleTypeCost = 2000
} else if (vehicle.bodyType === "Sedan") {
  vehicleTypeCost = 1500
} else if (vehicle.bodyType === "Hatchback") {
  vehicleTypeCost = 1500
} else {
  vehicleTypeCost = 1500
}


// ---------------- FINAL ESTIMATE ----------------

const estimatedMonthly = Math.round(
  fuelCost +
  maintenanceCost +
  wearCost +
  engineServiceCost +
  ageCost +
  reliabilityCost +
  sparePartsCost +
  hybridBatteryCost +
  vehicleTypeCost
)

  return estimatedMonthly
}