import { useEffect, useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"

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
    <div className="p-16">
      <h2 className="text-2xl font-bold mb-6">Seller Dashboard</h2>

      <div className="grid grid-cols-3 gap-6">
        {vehicles.map(vehicle => (
          <div key={vehicle._id} className="bg-white p-6 shadow rounded-xl">
            <h3>{vehicle.brand} {vehicle.model}</h3>
            <p>Price: LKR {vehicle.price}</p>
          </div>
        ))}
      </div>
    </div>
  )
}