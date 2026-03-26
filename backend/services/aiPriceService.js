export const predictVehiclePrice = (vehicle) => {

  let predicted = vehicle.price

  if (vehicle.mileage > 100000)
    predicted *= 0.85

  if (vehicle.condition === "Reconditioned")
    predicted *= 1.1

  if (vehicle.fuelType === "Hybrid" || vehicle.fuelType === "Electric")
    predicted *= 1

  if (vehicle.manufacturedYear < 2015)
    predicted *= 0.9

  return Math.round(predicted)
}

export const bestDealScore = (vehicle) => {

  const predicted = predictVehiclePrice(vehicle)

  const difference = predicted - vehicle.price

  const score = Math.min(100, Math.max(0, difference / predicted * 100))

  return Math.round(score)

}
