import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "../api/axios"
import Navbar from "../components/Navbar"
import VehicleCard from "../components/VehicleCard"
import { motion } from "framer-motion"

export default function SellerProfile() {

  const { id } = useParams()

  const [seller, setSeller] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSeller()
  }, [id])

  const fetchSeller = async () => {
  try {
    setLoading(true)

    // ✅ CORRECT
    const userRes = await axios.get(`/users/${id}`)
    setSeller(userRes.data)

    // ❌ REMOVE any req.params.id usage here

    const vehicleRes = await axios.get(`/vehicles/user/${id}`)
    setVehicles(vehicleRes.data)

    setLoading(false)

  } catch (err) {
    console.error(err)
    setLoading(false)
  }
}

  if (!seller) return <div className="p-10">Loading...</div>

  return (
    <div className="bg-gray-100 min-h-screen">

      <Navbar />

      {/* 🔥 HERO SECTION */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-16 px-16 overflow-hidden">

        <div className="absolute w-[500px] h-[500px] bg-orange-500 opacity-20 blur-3xl rounded-full top-[-100px] left-[-100px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >

          <h1 className="text-4xl font-bold mb-2">
            {seller.username}
          </h1>

          <p className="opacity-80 mb-4">
            Trusted seller on Motoriq 🚗
          </p>

          <div className="flex gap-6 text-sm">

            <span>
              ⭐ {seller.sellerRating || 5} Rating
            </span>

            <span>
              🛡 {seller.trustScore || 50}/100 Trust Score
            </span>

            <span>
              📦 {vehicles.length} Listings
            </span>

          </div>

        </motion.div>
      </div>

      {/* 🔥 SELLER INFO CARD */}
      <div className="px-16 mt-[-40px] relative z-20">

        <div className="bg-white/80 backdrop-blur-lg border border-white/40 shadow-xl rounded-2xl p-6 flex flex-wrap justify-between gap-6">

          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-semibold">{seller.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Joined</p>
            <p className="font-semibold">
              {seller.createdAt
                ? new Date(seller.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Last Active</p>
            <p className="font-semibold">
              {seller.lastLogin
                ? new Date(seller.lastLogin).toLocaleString()
                : "N/A"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Seller Rating</p>
            <p className="font-semibold text-yellow-500">
              {seller.sellerRating || 5} ⭐
            </p>
          </div>

        </div>
      </div>

      {/* 🔥 VEHICLE LISTINGS */}
      <div className="px-16 py-16">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            Listings ({vehicles.length})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : vehicles.length > 0 ? (

          <div className="grid grid-cols-6 gap-5">

            {vehicles.map((vehicle, index) => (

              <motion.div
                key={vehicle._id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
              >

                <VehicleCard
                  vehicle={vehicle}
                  monthlyBudget={50000}
                />

              </motion.div>

            ))}

          </div>

        ) : (
          <div className="text-center text-gray-500 py-20">
            No listings found
          </div>
        )}

      </div>

    </div>
  )
}