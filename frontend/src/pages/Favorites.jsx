import { useEffect, useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import VehicleCard from "../components/VehicleCard"
import Navbar from "../components/Navbar"

export default function Favorites() {

  const { token } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const fetchFavorites = async () => {
      try {

        const res = await axios.get("/users/profile", {
          headers: { Authorization: token }
        })

        setVehicles(res.data.favorites || [])

      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    if (token) fetchFavorites()

  }, [token])

  return (

    <div className="min-h-screen bg-gray-100">

      {/* NAVBAR */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">

          <h2 className="text-2xl font-bold text-gray-800">
            ❤️ Your Favorite Vehicles
          </h2>

          <span className="text-gray-500 text-sm">
            {vehicles.length} saved
          </span>

        </div>


        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-500">
            Loading favorites...
          </p>
        )}


        {/* EMPTY STATE */}
        {!loading && vehicles.length === 0 && (
          <div className="text-center py-20">

            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Favorites Yet
            </h3>

            <p className="text-gray-500 mb-6">
              Start adding vehicles to your favorites ❤️
            </p>

            <button
              onClick={() => window.location.href = "/"}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
            >
              Browse Vehicles
            </button>

          </div>
        )}


        {/* VEHICLE GRID */}
        {!loading && vehicles.length > 0 && (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

            {vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle._id}
                vehicle={vehicle}
                compareList={[]}
                setCompareList={() => {}}
                monthlyBudget={50000}
              />
            ))}

          </div>

        )}

      </div>

    </div>

  )
}