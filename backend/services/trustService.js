export const calculateTrust = (vehicle) => {
  let score = 100

  if (vehicle.price > 10000000) score -= 20
  if (vehicle.mileage > 150000) score -= 20
  if (!vehicle.image) score -= 10

  return score
}