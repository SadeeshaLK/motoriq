export const calculateMonthlyCost = (vehicle = {}) => {

  // ---------------- SAFE DEFAULTS ----------------
  const fuelType = (vehicle.fuelType || "").toLowerCase();
  const engineCapacity = vehicle.engineCapacity || 1500;
  const mileage = vehicle.mileage || 0;
  const manufacturedYear = vehicle.manufacturedYear || new Date().getFullYear();
  const brand = vehicle.brand || "";

  // ---------------- FUEL PRICE ----------------
  let fuelPrice = 365;

  switch (fuelType) {
    case "petrol":
      fuelPrice = 365;
      break;
    case "diesel":
      fuelPrice = 400;
      break;
    case "hybrid":
      fuelPrice = 365;
      break;
    case "electric":
      fuelPrice = 65;
      break;
    default:
      fuelPrice = 420;
  }

  // ---------------- MONTHLY DISTANCE ----------------
  let monthlyDistance = 1500;

  if (engineCapacity <= 1300) monthlyDistance = 1600;
  else if (engineCapacity <= 2000) monthlyDistance = 1400;
  else monthlyDistance = 1200;

  // ---------------- FUEL EFFICIENCY ----------------
  let efficiency = vehicle.fuelEfficiency;

  if (!efficiency) {
    if (fuelType === "electric") {
      efficiency = 6;
    } else if (fuelType === "hybrid") {
      if (engineCapacity <= 1500) efficiency = 25;
      else if (engineCapacity <= 2000) efficiency = 20;
      else efficiency = 16;
    } else if (fuelType === "diesel") {
      if (engineCapacity <= 1500) efficiency = 20;
      else if (engineCapacity <= 2000) efficiency = 17;
      else efficiency = 14;
    } else {
      if (engineCapacity <= 1300) efficiency = 16;
      else if (engineCapacity <= 1800) efficiency = 13;
      else if (engineCapacity <= 2500) efficiency = 10;
      else efficiency = 8;
    }
  }

  // ---------------- FUEL COST ----------------
  let fuelCost = 0;

  if (fuelType === "electric") {
    const kwhUsed = monthlyDistance / efficiency;
    fuelCost = kwhUsed * fuelPrice;
  } else {
    const litersUsed = monthlyDistance / efficiency;
    fuelCost = litersUsed * fuelPrice;
  }

  // ---------------- MAINTENANCE ----------------
  let serviceCost = 27500;

  switch (vehicle.maintenanceLevel) {
    case "low":
      serviceCost = 27500;
      break;
    case "medium":
      serviceCost = 40000;
      break;
    case "high":
      serviceCost = 75000;
      break;
  }

  let maintenancePeriod = 12;

  switch (vehicle.maintenancePeriod) {
    case "6 months":
      maintenancePeriod = 6;
      break;
    case "3 months":
      maintenancePeriod = 3;
      break;
    case "1 year":
    default:
      maintenancePeriod = 12;
  }

  const maintenanceCost = Math.round(serviceCost / maintenancePeriod);

  // ---------------- WEAR COST ----------------
  let wearCost = 0;

  if (mileage > 180000) wearCost = 7000;
  else if (mileage > 120000) wearCost = 4500;
  else if (mileage > 80000) wearCost = 2500;
  else if (mileage > 40000) wearCost = 1200;
  else wearCost = 500;

  // ---------------- ENGINE SERVICE ----------------
  let engineServiceCost = 0;

  if (engineCapacity <= 1300) engineServiceCost = 1500;
  else if (engineCapacity <= 2000) engineServiceCost = 3000;
  else engineServiceCost = 5000;

  // ---------------- AGE COST ----------------
  let ageCost = 0;

  const currentYear = new Date().getFullYear();
  const age = currentYear - manufacturedYear;

  if (age > 15) ageCost = 6000;
  else if (age > 10) ageCost = 4000;
  else if (age > 5) ageCost = 2000;
  else ageCost = 500;

  // ---------------- BRAND RELIABILITY ----------------
  let reliabilityCost = 0;

  const reliableBrands = ["Toyota", "Honda", "Suzuki"];
  const mediumBrands = ["Nissan", "Mazda", "Mitsubishi"];

  if (reliableBrands.includes(brand)) reliabilityCost = 500;
  else if (mediumBrands.includes(brand)) reliabilityCost = 1500;
  else reliabilityCost = 3000;

  // ---------------- SPARE PARTS ----------------
  let sparePartsCost = 2000;

  const expensiveBrands = ["BMW", "Mercedes", "Audi", "Land Rover"];

  if (expensiveBrands.includes(brand)) {
    sparePartsCost = 6000;
  }

  // ---------------- HYBRID BATTERY ----------------
  let hybridBatteryCost = 0;

  if (fuelType === "hybrid") {
    if (age > 8 || mileage > 150000) {
      hybridBatteryCost = 5000;
    } else {
      hybridBatteryCost = 1500;
    }
  }

  // ---------------- VEHICLE TYPE ----------------
  let vehicleTypeCost = 1500;

  switch (vehicle.bodyType) {
    case "SUV":
      vehicleTypeCost = 2500;
      break;
    case "Pickup":
      vehicleTypeCost = 2000;
      break;
    case "Sedan":
    case "Hatchback":
      vehicleTypeCost = 1500;
      break;
  }

  // ---------------- FINAL ----------------
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
  );

  return estimatedMonthly;
};