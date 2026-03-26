import CostChart from "./CostChart"
//import axios from "axios"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { calculateMonthlyCost } from "../utils/calculateMonthlyCost"
import { useCompare } from "../context/CompareContext"

export default function VehicleCard({
  vehicle,
  compareList,
  setCompareList,
  monthlyBudget
}) {
  const navigate = useNavigate()
  const { token } = useAuth()

  const estimatedMonthly = calculateMonthlyCost(vehicle)

  const isCityFriendly =
    vehicle.fuelEfficiency > 18 &&
    vehicle.mileage < 80000 &&
    vehicle.maintenanceLevel === "low"

  const { addToCompare } = useCompare()

  // Seller Rating Logic
  let sellerRating = null

  if (vehicle.user) {

    if (vehicle.user.rating) {
      sellerRating = vehicle.user.rating
    } 
    else if (vehicle.trustScore) {
      sellerRating = Math.min(5, (vehicle.trustScore / 20)).toFixed(1)
    }
    else {
      sellerRating = 3.5
    }

  }

  // IMAGE LOGIC
  let imageUrl = "/no-image.png"

  if (vehicle.images && vehicle.images.length > 0) {
    let firstImage = vehicle.images[0]

    if (firstImage.startsWith("/")) {
      firstImage = firstImage.slice(1)
    }

    if (firstImage.startsWith("http")) {
      imageUrl = firstImage
    }
    else if (firstImage.startsWith("uploads/")) {
      imageUrl = `http://localhost:5000/${firstImage}`
    }
    else {
      imageUrl = `http://localhost:5000/uploads/${firstImage}`
    }
  }

  return (

    <div
      onClick={() => navigate(`/vehicle/${vehicle._id}`)}
      className="bg-white rounded-xl shadow p-4 hover:shadow-2xl transition cursor-pointer flex flex-col"
    >

      {/* IMAGE */}
      {vehicle.images?.length > 0 ? (
        <img
          src={imageUrl}
          alt={`${vehicle.brand || ""} ${vehicle.model || ""}`}
          className="h-48 w-full object-cover rounded-lg"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = "/no-image.png"
          }}
        />
      ) : (
        <div className="h-48 w-full rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
          No Image
        </div>
      )}

      {/* TITLE */}
      <h3 className="font-bold mt-3 text-lg">
        {vehicle.brand} {vehicle.model} {vehicle.manufacturedYear}
      </h3>

      {/* LOCATION */}
      <div className="text-xs text-gray-500 mt-1">
        📍 {vehicle.city || vehicle.district || "Location not specified"}
      </div>

      {/* SELLER RATING */}
      {sellerRating && (
        <div className="text-xs mt-2 bg-yellow-400 text-black px-2 py-1 rounded w-fit">
          ⭐ Seller Rating: {sellerRating}
        </div>
      )}

      {/* PRICE */}
      <p className="text-orange-600 font-semibold text-lg mt-1">
        LKR {vehicle.price?.toLocaleString()}
      </p>

      {/* VEHICLE DETAILS */}
      <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-700">

        <span className="bg-gray-100 px-2 py-1 rounded">
          🛣 {vehicle.mileage?.toLocaleString()} km
        </span>

        {vehicle.transmission && (
          <span className="bg-gray-100 px-2 py-1 rounded">
            ⚙ {vehicle.transmission}
          </span>
        )}

        {vehicle.fuelType && (
          <span className="bg-gray-100 px-2 py-1 rounded">
            ⛽ {vehicle.fuelType}
          </span>
        )}

        {vehicle.engineCapacity && (
          <span className="bg-gray-100 px-2 py-1 rounded">
            🔧 {vehicle.engineCapacity}cc
          </span>
        )}

      </div>

      {/* DEAL SCORE */}
      {vehicle.dealScore > 20 && (
        <div className="text-xs mt-2 bg-green-600 text-white px-2 py-1 rounded w-fit">
          🔥 Best Deal
        </div>
      )}

      {/* TRUST SCORE */}
      <div className="text-xs mt-2 bg-purple-100 text-purple-700 px-2 py-1 rounded w-fit">
        Trust Score: {vehicle.trustScore ?? 0}/100
      </div>

      {/* MONTHLY COST */}
      <div className="text-xs mt-2 bg-blue-100 px-2 py-1 rounded w-fit">
        Est Monthly: LKR {estimatedMonthly?.toLocaleString()}
      </div>

      {/* BUDGET BADGE */}
      {estimatedMonthly <= monthlyBudget && (
        <div className="text-xs mt-2 bg-green-100 text-green-700 px-2 py-1 rounded w-fit">
          Within Budget
        </div>
      )}

      {/* CITY FRIENDLY */}
      {isCityFriendly && (
        <div className="text-xs mt-2 bg-green-500 text-white px-2 py-1 rounded w-fit">
          Best for City Driving
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex gap-2 mt-3">

        <button
  onClick={async (e) => {
    e.stopPropagation()

    try {
      await axios.post(
        `/users/favorite/${vehicle._id}`,
        {},
        { headers: { Authorization: token } }
      )

      //alert("Added to favorites ❤️")
    } catch (err) {
      //console.error(err)
      //alert("Failed to add favorite")
    }
  }}
  className="text-xs bg-red-100 px-3 py-1 rounded hover:bg-red-200"
>
  ❤️ Favorite
</button>

<button
  onClick={(e)=>{
    e.stopPropagation()
    addToCompare(vehicle)
  }}
  className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
>
  ⚖ Compare
</button>

      </div>

      {/* COST CHART */}
      <div className="mt-4">
        <CostChart vehicle={vehicle} />
      </div>

    </div>
  )
}