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
      <div style={{ background: 'var(--bg-body)', minHeight: '100vh' }}>
        <Navbar/>
        <p className="p-10 text-center" style={{ color: 'var(--text-muted)' }}>
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

    <div className="grid grid-cols-4 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>

      <div className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </div>

      {vehicles.map(v => {

        const value = v[key]

        const highlight = bestValue !== null && value === bestValue

        return (

          <div
            key={v._id}
            className={`text-center transition ${
              highlight ? "font-semibold scale-105" : ""
            }`}
            style={{ color: highlight ? 'var(--green)' : 'var(--text-primary)' }}
          >
            {value}{suffix}
          </div>

        )

      })}

    </div>

  )

  return (

    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      <Navbar/>

      <div className="max-w-7xl mx-auto p-10">

        <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
          Compare Vehicles
        </h2>

        {/* VEHICLE HEADER */}

        <div className="grid grid-cols-4 gap-6 mb-10">

          <div/>

          {vehicles.map(v => (

            <div
              key={v._id}
              className="rounded-xl p-4 text-center relative backdrop-blur-md transition-all"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}
            >

              <button
                onClick={()=>removeFromCompare(v._id)}
                style={{ color: 'var(--red)' }}
                className="absolute top-2 right-2"
              >
                ✕
              </button>

              <img
                src={`https://motoriq-lk.onrender.com${v.images[0]}`}
                className="h-40 w-full object-cover rounded"
              />

              <h3 className="font-semibold mt-3" style={{ color: 'var(--text-primary)' }}>
                {v.brand} {v.model}
              </h3>

              <p className="font-bold" style={{ color: 'var(--primary)' }}>
                LKR {v.price.toLocaleString()}
              </p>

            </div>

          ))}

        </div>


        {/* BASIC SPECS */}

        <div className="rounded-xl mb-6 backdrop-blur-md"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>

          <button
            onClick={()=>setOpenSpec({...openSpec,basic:!openSpec.basic})}
            className="w-full text-left p-4 font-semibold"
            style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}
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

        <div className="rounded-xl mb-6 backdrop-blur-md"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>

          <button
            onClick={()=>setOpenSpec({...openSpec,performance:!openSpec.performance})}
            className="w-full text-left p-4 font-semibold"
            style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            Performance
          </button>

          {openSpec.performance && (
            <div className="p-4 animate-fadeIn">
              {row("Engine Capacity","engineCapacity",""," cc")}
              {row("Vehicle Type","vehicleType")}
              {row("Condition","condition")}
            </div>
          )}

        </div>


        {/* AI SCORING */}

        <div className="rounded-xl backdrop-blur-md"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>

          <button
            onClick={()=>setOpenSpec({...openSpec,ai:!openSpec.ai})}
            className="w-full text-left p-4 font-semibold"
            style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)' }}
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