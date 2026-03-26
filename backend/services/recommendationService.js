export const rankVehicles = (vehicles, userBudget = 0) => {
  const currentYear = new Date().getFullYear()

  return vehicles
    .map(vehicle => {
      let score = 0

      if (userBudget && vehicle.price <= userBudget)
        score += 30

      score += (vehicle.fuelEfficiency || 0) * 2
      score += Math.max(0, 20 - (vehicle.mileage || 0) / 10000)

      if (vehicle.maintenanceLevel === "low") score += 15
      if (vehicle.maintenanceLevel === "medium") score += 5

      score += Math.max(0, 15 - (currentYear - vehicle.year))
      score += vehicle.trustScore || 0

      return {
        ...vehicle._doc,
        aiScore: Math.round(score)
      }
    })
    .sort((a, b) => b.aiScore - a.aiScore)
}

export const recommendVehicles = (currentVehicle, vehicles) => {

  return vehicles
    .map(v => {

      let score = 0

      if (v.brand === currentVehicle.brand) score += 3

      if (v.vehicleType === currentVehicle.vehicleType)
        score += 2

      if (Math.abs(v.price - currentVehicle.price) < 500000)
        score += 2

      if (v.city === currentVehicle.city)
        score += 1

      return { vehicle: v, score }

    })
    .sort((a,b) => b.score - a.score)
    .slice(0,6)
    .map(v => v.vehicle)

}
