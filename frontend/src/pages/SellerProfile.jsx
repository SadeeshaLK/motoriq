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

    const userRes = await axios.get(`/users/${id}`)
    setSeller(userRes.data)

    const vehicleRes = await axios.get(`/vehicles/user/${id}`)
    setVehicles(vehicleRes.data)

    setLoading(false)

  } catch (err) {
    console.error(err)
    setLoading(false)
  }
}

  if (!seller) return <div className="p-10" style={{ background: 'var(--bg-body)', color: 'var(--text-muted)', minHeight: '100vh' }}>Loading...</div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      <Navbar />

      {/* HERO SECTION */}
      <div className="relative py-16 px-16 overflow-hidden"
        style={{ background: `linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)` }}>

        <div className="absolute w-[500px] h-[500px] rounded-full top-[-100px] left-[-100px]" style={{ background: 'var(--primary)', opacity: 0.08, filter: 'blur(120px)' }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >

          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {seller.name}
          </h1>

          <p className="mb-4" style={{ color: 'var(--text-muted)' }}>
            Trusted seller on Motoriq 🚗
          </p>

          <div className="flex gap-6 text-sm" style={{ color: 'var(--text-secondary)' }}>

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

      {/* SELLER INFO CARD */}
      <div className="px-16 mt-[-40px] relative z-20">

        <div className="backdrop-blur-lg rounded-2xl p-6 flex flex-wrap justify-between gap-6"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>


          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Joined</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {seller.createdAt
                ? new Date(seller.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>

          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Last Active</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {seller.lastLogin
                ? new Date(seller.lastLogin).toLocaleString()
                : "N/A"}
            </p>
          </div>

          <div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Seller Rating</p>
            <p className="font-semibold" style={{ color: 'var(--yellow)' }}>
              {seller.sellerRating || 5} ⭐
            </p>
          </div>

        </div>
      </div>

      {/* VEHICLE LISTINGS */}
      <div className="px-16 py-16">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Listings ({vehicles.length})
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 animate-shimmer rounded-xl" style={{ background: 'var(--bg-glass)' }}></div>
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
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            No listings found
          </div>
        )}

      </div>

    </div>
  )
}