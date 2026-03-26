export const calculateTrustScore = (vehicle) => {

  let score = 50

  const mileage = Number(vehicle.mileage)
  const price = Number(vehicle.price)
  const condition = vehicle.condition

  /* Mileage scoring */
  if (mileage === 0) score += 20
  else if (mileage < 50000) score += 15
  else if (mileage < 100000) score += 10
  else if (mileage < 200000) score -= 5
  else score -= 15

  /* Condition scoring */
  if (condition === "Brand New") score += 20
  else if (condition === "Reconditioned") score += 10
  else if (condition === "Used") score += 5

  /* Price scoring */
  if (price < 2000000) score += 10
  else if (price < 5000000) score += 5
  else if (price > 20000000) score -= 10

  /* Clamp score */
  if (score > 100) score = 100
  if (score < 0) score = 0

  return score
}