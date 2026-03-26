import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import axios from "../api/axios"
import Navbar from "../components/Navbar"
import VehicleCard from "../components/VehicleCard"

export default function Search() {

  const location = useLocation()

  const [vehicles,setVehicles] = useState([])
  const [loading,setLoading] = useState(true)

  const params = new URLSearchParams(location.search)
  const query = params.get("q")

  useEffect(()=>{

    const fetchVehicles = async ()=>{

      setLoading(true)

      try{

        const res = await axios.get(`/search?q=${query}`)

        setVehicles(res.data)

      }catch(err){
        console.log(err)
      }

      setLoading(false)

    }

    fetchVehicles()

  },[location.search])   // ✅ IMPORTANT


  return (

    <div className="min-h-screen bg-gray-100">

      <Navbar/>

      <div className="max-w-7xl mx-auto p-10">

        <h2 className="text-2xl font-semibold mb-6">
          Search Results for "{query}"
        </h2>

        {loading && <p>Loading vehicles...</p>}

        {!loading && vehicles.length === 0 && (
          <p>No vehicles found</p>
        )}

        <div className="grid grid-cols-3 gap-6">

          {vehicles.map(vehicle=>(
            <VehicleCard
              key={vehicle._id}
              vehicle={vehicle}
              compareList={[]}
              setCompareList={()=>{}}
              monthlyBudget={50000}
            />
          ))}

        </div>

      </div>

    </div>

  )

}