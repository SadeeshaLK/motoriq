import { useEffect, useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import Navbar from "../components/Navbar"

export default function SellerDashboard() {

  const { token } = useAuth()
  const [vehicles, setVehicles] = useState([])

  useEffect(() => {
    const fetchMyVehicles = async () => {
      const res = await axios.get("/vehicles/my", {
        headers: { Authorization: token }
      })
      setVehicles(res.data)
    }

    fetchMyVehicles()
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      <Navbar />

      <div className="max-w-7xl mx-auto p-16">

        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Seller Dashboard</h2>

        <div className="grid grid-cols-3 gap-6">
          {vehicles.map(vehicle => (
            <div key={vehicle._id} className="p-6 rounded-xl backdrop-blur-md"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{vehicle.brand} {vehicle.model}</h3>
              <p style={{ color: 'var(--primary)' }}>Price: LKR {vehicle.price}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}