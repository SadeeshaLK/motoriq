import Navbar from "../components/Navbar"
import { useCompare } from "../context/CompareContext"
import { useState } from "react"

export default function Compare() {

  const { compareList, removeFromCompare } = useCompare()

  const [openSpec, setOpenSpec] = useState({
    basic: true,
    performance: true,
    ai: true
  })

  const vehicles = compareList

  if (vehicles.length === 0) {
    return (
      <div>
        <Navbar/>
        <p className="p-10 text-center text-gray-500">
          No vehicles selected for comparison
        </p>
      </div>
    )
  }

  /* BEST VALUE DETECTION */

  const bestPrice = Math.min(...vehicles.map(v => v.price))
  const bestMileage = Math.min(...vehicles.map(v => v.mileage))
  const bestTrust = Math.max(...vehicles.map(v => v.trustScore || 0))

  const row = (label, key, bestValue=null, suffix="") => (

    <div className="grid grid-cols-4 border-b py-4">

      <div className="font-semibold text-gray-700">
        {label}
      </div>

      {vehicles.map(v => {

        const value = v[key]

        const highlight = bestValue !== null && value === bestValue

        return (

          <div
            key={v._id}
            className={`text-center transition ${
              highlight ? "text-green-600 font-semibold scale-105" : ""
            }`}
          >
            {value}{suffix}
          </div>

        )

      })}

    </div>

  )

  return (

    <div className="min-h-screen bg-gray-100">

      <Navbar/>

      <div className="max-w-7xl mx-auto p-10">

        <h2 className="text-3xl font-bold mb-8">
          Compare Vehicles
        </h2>

        {/* VEHICLE HEADER */}

        <div className="grid grid-cols-4 gap-6 mb-10">

          <div/>

          {vehicles.map(v => (

            <div
              key={v._id}
              className="bg-white rounded-xl shadow p-4 text-center relative hover:shadow-lg transition"
            >

              <button
                onClick={()=>removeFromCompare(v._id)}
                className="absolute top-2 right-2 text-red-500"
              >
                ✕
              </button>

              <img
                src={`http://localhost:5000${v.images[0]}`}
                className="h-40 w-full object-cover rounded"
              />

              <h3 className="font-semibold mt-3">
                {v.brand} {v.model}
              </h3>

              <p className="text-orange-600 font-bold">
                LKR {v.price.toLocaleString()}
              </p>

            </div>

          ))}

        </div>


        {/* BASIC SPECS */}

        <div className="bg-white rounded-xl shadow mb-6">

          <button
            onClick={()=>setOpenSpec({...openSpec,basic:!openSpec.basic})}
            className="w-full text-left p-4 font-semibold border-b"
          >
            Basic Specifications
          </button>

          {openSpec.basic && (

            <div className="p-4 animate-fadeIn">

              {row("Price","price",bestPrice)}
              {row("Manufactured Year","manufacturedYear")}
              {row("Mileage","mileage",bestMileage," km")}
              {row("Fuel Type","fuelType")}
              {row("Transmission","transmission")}

            </div>

          )}

        </div>


        {/* PERFORMANCE */}

        <div className="bg-white rounded-xl shadow mb-6">

          <button
            onClick={()=>setOpenSpec({...openSpec,performance:!openSpec.performance})}
            className="w-full text-left p-4 font-semibold border-b"
          >
            Performance
          </button>

          {openSpec.performance && (

            <div className="p-4 animate-fadeIn">

              {row("Engine Capacity","engineCapacity","", " cc")}
              {row("Vehicle Type","vehicleType")}
              {row("Condition","condition")}

            </div>

          )}

        </div>


        {/* AI SCORING */}

        <div className="bg-white rounded-xl shadow">

          <button
            onClick={()=>setOpenSpec({...openSpec,ai:!openSpec.ai})}
            className="w-full text-left p-4 font-semibold border-b"
          >
            AI Analysis
          </button>

          {openSpec.ai && (

            <div className="p-4 animate-fadeIn">

              {row("Trust Score","trustScore",bestTrust)}
              {row("Deal Score","dealScore")}

            </div>

          )}

        </div>

      </div>

    </div>

  )

}