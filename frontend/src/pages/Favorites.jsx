import { useEffect, useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import Navbar from "../components/Navbar"
import VehicleCard from "../components/VehicleCard"

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

    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      {/* NAVBAR */}
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">

          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            ❤️ Your Favorite Vehicles
          </h2>

          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {vehicles.length} saved
          </span>

        </div>


        {/* LOADING */}
        {loading && (
          <p className="text-center" style={{ color: 'var(--text-muted)' }}>
            Loading favorites...
          </p>
        )}


        {/* EMPTY STATE */}
        {!loading && vehicles.length === 0 && (
          <div className="text-center py-20">

            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              No Favorites Yet
            </h3>

            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              Start adding vehicles to your favorites ❤️
            </p>

            <button
              onClick={() => window.location.href = "/"}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:-translate-y-0.5 transition-all duration-300"
              style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}
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