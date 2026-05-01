import { useEffect, useState } from "react"
import axios from "../api/axios"
import Navbar from "../components/Navbar"
import VehicleCard from "../components/VehicleCard"
import CategoryChips from "../components/CategoryChips"
import Pagination from "../components/Pagination"
import { useNavigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import { sriLanka } from "../data/sriLankaLocations"
import { brandAndModels } from "../data/brandAndModels"
import { useCompare } from "../context/CompareContext"
import { motion, AnimatePresence } from "framer-motion"


export default function Home() {

  const { isAuthenticated } = useAuth()

  const [vehicles, setVehicles] = useState([])
  const [category, setCategory] = useState("All")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const { compareList, removeFromCompare } = useCompare()
  const [showAdvanced, setShowAdvanced] = useState(false)


  const [filters, setFilters] = useState({
    brand: "",
    model: "",
    vehicleType: "",
    fuelType: "",
    condition: "",
    transmission: "",
    province: "",
    district: "",
    city: "",
    maxPrice: "",
    minPrice: "",
    maxMileage: "",
    minMileage: "",
    minYear: 2000,
    maxYear: new Date().getFullYear(),
    minEfficiency: "",
    maintenanceLevel: "",
    monthlyBudget: 50000,
    userLat: "",
    userLng: "",
    radius: 10
  })

  const navigate = useNavigate()



  const fetchVehicles = async () => {
    setLoading(true)
    const res = await axios.get("/vehicles/search", { params: filters })
    setVehicles(res.data)
    setLoading(false)
  }

  useEffect(() => {
    fetchVehicles()
  }, [filters])

  let filteredVehicles =
    category === "All"
      ? vehicles
      : vehicles.filter(v => {
        if (category === "Hybrid") {
          return v.fuelType?.toLowerCase() === "hybrid"
        }

        if (category === "Electric") {
          return v.fuelType?.toLowerCase() === "electric"
        }

        return v.vehicleType?.toLowerCase() === category.toLowerCase()
      })

  const [sortBy, setSortBy] = useState("")

  let sortedVehicles = [...filteredVehicles]

  switch (sortBy) {

    case "priceLow":
      sortedVehicles.sort((a, b) => a.price - b.price)
      break

    case "priceHigh":
      sortedVehicles.sort((a, b) => b.price - a.price)
      break

    case "yearNew":
      sortedVehicles.sort((a, b) => b.manufacturedYear - a.manufacturedYear)
      break

    case "mileageLow":
      sortedVehicles.sort((a, b) => a.mileage - b.mileage)
      break

    case "trustScore":
      sortedVehicles.sort((a, b) => b.trustScore - a.trustScore)
      break

    case "lowestMonthly":
      sortedVehicles.sort((a, b) => a.estimatedMonthly - b.estimatedMonthly)
      break

    case "bestValue":
      sortedVehicles.sort((a, b) => {
        const scoreA = a.trustScore / a.price
        const scoreB = b.trustScore / b.price
        return scoreB - scoreA
      })
      break

    default:
      break
  }

  const paginated = sortedVehicles.slice((page - 1) * 12, page * 12)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      <Navbar />

      {/* HERO SECTION */}
      <div className="relative md:min-h-[620px] flex items-center overflow-hidden pt-4 md:pt-6 pb-6 md:pb-0"
        style={{ background: `linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 40%, var(--hero-to) 100%)` }}
      >

        {/* BACKGROUND GLOWS — hidden on mobile */}
        <div className="hidden md:block absolute w-[700px] h-[700px] rounded-full top-[-200px] left-[-200px]" style={{ background: 'var(--primary)', opacity: 0.06, filter: 'blur(150px)' }} />
        <div className="hidden md:block absolute w-[500px] h-[500px] rounded-full bottom-[-100px] right-[-100px]" style={{ background: 'var(--blue)', opacity: 0.04, filter: 'blur(120px)' }} />

        {/* Grid pattern — hidden on mobile */}
        <div className="hidden md:block absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(var(--border-glass) 1px, transparent 1px), linear-gradient(90deg, var(--border-glass) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="px-4 md:px-16 w-full relative z-10">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-4 md:mb-6"
              style={{ background: 'var(--primary-glow)', border: '1px solid rgba(249, 48, 22, 0.2)', color: 'var(--primary-light)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--primary)' }} />
              AI-Powered Vehicle Marketplace
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl md:text-5xl font-bold mb-3 md:mb-4 leading-tight max-w-2xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-500">Perfect Car</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5 md:mb-8 max-w-xl text-sm md:text-base"
            style={{ color: 'var(--text-muted)' }}
          >
            Smart recommendations based on price, fuel, maintenance & trust scoring.
          </motion.p>

          {/* FILTER PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="backdrop-blur-xl rounded-2xl p-4 md:p-6 space-y-4 md:space-y-5 max-w-5xl mb-6 md:mb-10"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}
          >

            {/* BASIC FILTERS */}
            <div>
              <h3 className="text-sm font-semibold mb-3 md:mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">

                <select
                  className="input"
                  value={filters.brand}
                  onChange={(e) =>
                    setFilters({ ...filters, brand: e.target.value, model: "" })
                  }
                >
                  <option value="">Brand</option>
                  {Object.keys(brandAndModels).map((brand) => (
                    <option key={brand}>{brand}</option>
                  ))}
                </select>

                <select
                  className="input"
                  value={filters.model}
                  onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                  disabled={!filters.brand}
                >
                  <option value="">Model</option>
                  {filters.brand && brandAndModels[filters.brand].map((model) => (
                    <option key={model}>{model}</option>
                  ))}
                </select>

                <select
                  className="input"
                  onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                >
                  <option value="">Vehicle Type</option>
                  <option>SUV</option><option>Sedan</option><option>Hatchback</option>
                  <option>Pickup</option><option>Van</option><option>Hybrid</option><option>Electric</option>
                </select>

              </div>
            </div>

            {/* ADVANCED TOGGLE */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
            </button>

            {/* ADVANCED FILTERS */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 overflow-hidden pt-6"
                  style={{ borderTop: '1px solid var(--border-subtle)' }}
                >

                  {/* LOCATION */}
                  <div>
                    <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Location</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <select className="input" value={filters.province}
                        onChange={(e) => setFilters({ ...filters, province: e.target.value, district: "", city: "" })}>
                        <option value="">Province</option>
                        {Object.keys(sriLanka).map(p => <option key={p}>{p}</option>)}
                      </select>
                      <select className="input" value={filters.district}
                        onChange={(e) => setFilters({ ...filters, district: e.target.value, city: "" })} disabled={!filters.province}>
                        <option value="">District</option>
                        {filters.province && Object.keys(sriLanka[filters.province]).map(d => <option key={d}>{d}</option>)}
                      </select>
                      <select className="input" value={filters.city}
                        onChange={(e) => setFilters({ ...filters, city: e.target.value })} disabled={!filters.district}>
                        <option value="">City</option>
                        {filters.district && sriLanka[filters.province][filters.district].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* VEHICLE DETAILS */}
                  <div>
                    <h4 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Vehicle Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <select className="input" onChange={(e) => setFilters({ ...filters, condition: e.target.value })}>
                        <option value="">Condition</option><option>Brand New</option><option>Used</option><option>Reconditioned</option>
                      </select>
                      <select className="input" onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}>
                        <option value="">Transmission</option><option>Automatic</option><option>Manual</option><option>CVT</option>
                      </select>
                      <select className="input" onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}>
                        <option value="">Fuel Type</option><option>Petrol</option><option>Diesel</option><option>Hybrid</option><option>Electric</option>
                      </select>
                    </div>
                  </div>

                  {/* YEAR */}
                  <div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                      Model Year: <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{filters.minYear}</span> — <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{filters.maxYear}</span>
                    </p>
                    <div className="flex gap-4">
                      <input type="range" min="1990" max={new Date().getFullYear()} value={filters.minYear}
                        onChange={(e) => setFilters({ ...filters, minYear: e.target.value })} className="w-full" />
                      <input type="range" min="1990" max={new Date().getFullYear()} value={filters.maxYear}
                        onChange={(e) => setFilters({ ...filters, maxYear: e.target.value })} className="w-full" />
                    </div>
                  </div>

                  {/* PRICE + MILEAGE */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <input type="number" placeholder="Min Price" className="input" onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} />
                    <input type="number" placeholder="Max Price" className="input" onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} />
                    <input type="number" placeholder="Min Mileage" className="input" onChange={(e) => setFilters({ ...filters, minMileage: e.target.value })} />
                    <input type="number" placeholder="Max Mileage" className="input" onChange={(e) => setFilters({ ...filters, maxMileage: e.target.value })} />
                  </div>

                  {/* RADIUS */}
                  <div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                      Search Radius: <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{filters.radius} km</span>
                    </p>
                    <input type="range" min="5" max="100" step="5" value={filters.radius}
                      onChange={(e) => setFilters({ ...filters, radius: e.target.value })} className="w-full" />
                  </div>

                  {/* MAINTENANCE */}
                  <select className="input" onChange={(e) => setFilters({ ...filters, maintenanceLevel: e.target.value })}>
                    <option value="">Maintenance Level</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>

                  {/* MONTHLY */}
                  <div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                      Monthly Budget: <span style={{ color: 'var(--primary)', fontWeight: 500 }}>LKR {filters.monthlyBudget?.toLocaleString()}</span>
                    </p>
                    <input type="range" min="20000" max="200000" step="5000" value={filters.monthlyBudget}
                      onChange={(e) => setFilters({ ...filters, monthlyBudget: e.target.value })} className="w-full" />
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>

        </div>

      </div>

      {/* CONTENT */}
      <div className="px-4 md:px-16 py-6 md:py-12">

        <div className="flex justify-between items-center flex-wrap gap-4">
          <CategoryChips selected={category} setSelected={setCategory} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input !w-auto min-w-[180px]">
            <option value="">Sort By</option>
            <option value="bestValue">Best Value</option>
            <option value="lowestMonthly">Lowest Monthly Cost</option>
            <option value="trustScore">Highest Trust Score</option>
            <option value="priceLow">Price: Low → High</option>
            <option value="priceHigh">Price: High → Low</option>
            <option value="yearNew">Year: Newest</option>
            <option value="mileageLow">Mileage: Low → High</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
              {paginated.map((vehicle, index) => (
                <motion.div
                  key={vehicle._id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <VehicleCard vehicle={vehicle} monthlyBudget={filters.monthlyBudget} />
                </motion.div>
              ))}
            </div>

            <div className="mt-16">
              <Pagination page={page} setPage={setPage} />
            </div>
          </>
        )}

      </div>

      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-xl border px-6 py-3 rounded-2xl flex items-center gap-6 z-50"
          style={{ background: 'var(--compare-bg)', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Compare ({compareList.length}/3)
          </span>

          {compareList.map(v => (
            <div key={v._id} className="relative">
              <img src={`https://motoriq-lk.onrender.com${v.images[0]}`}
                className="h-10 w-16 object-cover rounded-lg" style={{ border: '1px solid var(--border-glass)' }} />
              <button onClick={() => removeFromCompare(v._id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg">
                ✕
              </button>
            </div>
          ))}

          <button onClick={() => navigate("/compare")}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
            style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}>
            Compare
          </button>

        </div>
      )}

      <button
        onClick={() => {
          if (!isAuthenticated) navigate("/login")
          else navigate("/add-vehicle")
        }}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white
                   px-6 py-4 rounded-2xl hover:scale-105 transition-all duration-300 font-semibold text-sm flex items-center gap-2 z-40"
        style={{ boxShadow: '0 8px 24px var(--primary-glow)' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        Post Free Ad
      </button>

    </div>
  )
}