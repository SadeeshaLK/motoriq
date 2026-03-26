export const estimatePrice = (vehicle) => {
  const currentYear = new Date().getFullYear()
  const age = currentYear - vehicle.year

  let ageFactor = 1 - age * 0.05
  if (ageFactor < 0.4) ageFactor = 0.4

  const mileageFactor = vehicle.mileage > 100000 ? 0.8 : 1

  const conditionFactor = vehicle.condition
    ? vehicle.condition / 10
    : 1

  return Math.round(
    vehicle.price *
      ageFactor *
      mileageFactor *
      conditionFactor
  )
}