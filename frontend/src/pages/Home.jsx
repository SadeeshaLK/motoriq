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

  /*useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setFilters(prev => ({
        ...prev,
        userLat: position.coords.latitude,
        userLng: position.coords.longitude
      }))
    })
    fetchVehicles()
  }, [])*/

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

// ALWAYS COPY ARRAY BEFORE SORTING
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
    <div className="bg-gray-100 min-h-screen ">

      <Navbar />

      {/* HERO SECTION */}
      <div className="relative min-h-[600px] bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center overflow-hidden pt-6">

  {/* BACKGROUND GLOW */}
  <div className="absolute w-[600px] h-[600px] bg-orange-500 opacity-20 blur-3xl rounded-full top-[-100px] left-[-100px]" />

  <div className="px-16 w-full relative z-10">

    <motion.h1
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-5xl font-bold mb-4 leading-tight"
    >
      Find Your Perfect Car 🚗
    </motion.h1>

    <motion.p
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="opacity-80 mb-6 max-w-2xl text-lg"
    >
      AI-powered recommendations based on price, fuel, maintenance & trust.
    </motion.p>
<button
  onClick={() => setShowAdvanced(!showAdvanced)}
  className="mb-4 text-sm underline text-white"
>
  {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
</button>
    {/* FILTER PANEL */}
    <motion.div
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}

             className="backdrop-blur-xl bg-white/80 border border-white/40 
text-black rounded-2xl shadow-xl p-5 mt-4 space-y-5 max-w-7xl mx-auto mb-10"

             
>

  {/* ================= BASIC FILTERS ================= */}
  <div>
    <h3 className="font-semibold text-gray-700 mb-4">
      Basic Filters
    </h3>

    <div className="grid md:grid-cols-3 gap-4">

      {/* BRAND */}
      <select
        className="input"
        value={filters.brand}
        onChange={(e) =>
          setFilters({
            ...filters,
            brand: e.target.value,
            model: ""
          })
        }
      >
        <option value="">Brand</option>
        {Object.keys(brandAndModels).map((brand) => (
          <option key={brand}>{brand}</option>
        ))}
      </select>

      {/* MODEL */}
      <select
        className="input"
        value={filters.model}
        onChange={(e) =>
          setFilters({
            ...filters,
            model: e.target.value
          })
        }
        disabled={!filters.brand}
      >
        <option value="">Model</option>
        {filters.brand &&
          brandAndModels[filters.brand].map((model) => (
            <option key={model}>{model}</option>
          ))}
      </select>

      {/* TYPE */}
      <select
        className="input"
        onChange={(e) =>
          setFilters({ ...filters, vehicleType: e.target.value })
        }
      >
        <option value="">Vehicle Type</option>
        <option>SUV</option>
        <option>Sedan</option>
        <option>Hatchback</option>
        <option>Pickup</option>
        <option>Van</option>
        <option>Hybrid</option>
        <option>Electric</option>
      </select>

    </div>
  </div>

  {/* ================= ADVANCED TOGGLE ================= */}
  <button
    onClick={() => setShowAdvanced(!showAdvanced)}
    className="text-sm text-orange-500 font-medium hover:underline"
  >
    {showAdvanced ? "Hide Advanced Filters" : "Show Advanced Filters"}
  </button>

  {/* ================= ADVANCED FILTERS ================= */}
  <AnimatePresence>

    {showAdvanced && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8 overflow-hidden border-t pt-6"
      >

        {/* LOCATION */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Location
          </h4>

          <div className="grid md:grid-cols-3 gap-4">

            <select
              className="input"
              value={filters.province}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  province: e.target.value,
                  district: "",
                  city: ""
                })
              }
            >
              <option value="">Province</option>
              {Object.keys(sriLanka).map(p => (
                <option key={p}>{p}</option>
              ))}
            </select>

            <select
              className="input"
              value={filters.district}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  district: e.target.value,
                  city: ""
                })
              }
              disabled={!filters.province}
            >
              <option value="">District</option>
              {filters.province &&
                Object.keys(sriLanka[filters.province]).map(d => (
                  <option key={d}>{d}</option>
                ))}
            </select>

            <select
              className="input"
              value={filters.city}
              onChange={(e) =>
                setFilters({ ...filters, city: e.target.value })
              }
              disabled={!filters.district}
            >
              <option value="">City</option>
              {filters.district &&
                sriLanka[filters.province][filters.district].map(c => (
                  <option key={c}>{c}</option>
                ))}
            </select>

          </div>
        </div>

        {/* VEHICLE DETAILS */}
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Vehicle Details
          </h4>

          <div className="grid md:grid-cols-3 gap-4">

            <select
              className="input"
              onChange={(e) =>
                setFilters({ ...filters, condition: e.target.value })
              }
            >
              <option value="">Condition</option>
              <option>Brand New</option>
              <option>Used</option>
              <option>Reconditioned</option>
            </select>

            <select
              className="input"
              onChange={(e) =>
                setFilters({ ...filters, transmission: e.target.value })
              }
            >
              <option value="">Transmission</option>
              <option>Automatic</option>
              <option>Manual</option>
              <option>CVT</option>
            </select>

            <select
              className="input"
              onChange={(e) =>
                setFilters({ ...filters, fuelType: e.target.value })
              }
            >
              <option value="">Fuel Type</option>
              <option>Petrol</option>
              <option>Diesel</option>
              <option>Hybrid</option>
              <option>Electric</option>
            </select>

          </div>
        </div>

        {/* YEAR */}
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Model Year: {filters.minYear} - {filters.maxYear}
          </p>

          <div className="flex gap-4">
            <input
              type="range"
              min="1990"
              max={new Date().getFullYear()}
              value={filters.minYear}
              onChange={(e) =>
                setFilters({ ...filters, minYear: e.target.value })
              }
              className="w-full accent-orange-500"
            />
            <input
              type="range"
              min="1990"
              max={new Date().getFullYear()}
              value={filters.maxYear}
              onChange={(e) =>
                setFilters({ ...filters, maxYear: e.target.value })
              }
              className="w-full accent-orange-500"
            />
          </div>
        </div>

        {/* PRICE + MILEAGE */}
        <div className="grid md:grid-cols-4 gap-4">

          <input
            type="number"
            placeholder="Min Price"
            className="input"
            onChange={(e) =>
              setFilters({ ...filters, minPrice: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Max Price"
            className="input"
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Min Mileage"
            className="input"
            onChange={(e) =>
              setFilters({ ...filters, minMileage: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Max Mileage"
            className="input"
            onChange={(e) =>
              setFilters({ ...filters, maxMileage: e.target.value })
            }
          />

        </div>

        {/* RADIUS */}
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Search Radius: {filters.radius} km
          </p>

          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={filters.radius}
            onChange={(e) =>
              setFilters({ ...filters, radius: e.target.value })
            }
            className="w-full accent-orange-500"
          />
        </div>

        {/* MAINTENANCE */}
        <select
          className="input"
          onChange={(e) =>
            setFilters({
              ...filters,
              maintenanceLevel: e.target.value
            })
          }
        >
          <option value="">Maintenance Level</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {/* MONTHLY */}
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Monthly Budget: LKR {filters.monthlyBudget}
          </p>

          <input
            type="range"
            min="20000"
            max="200000"
            step="5000"
            value={filters.monthlyBudget}
            onChange={(e) =>
              setFilters({
                ...filters,
                monthlyBudget: e.target.value
              })
            }
            className="w-full accent-orange-500"
          />
        </div>

      </motion.div>
    )}

  </AnimatePresence>

</motion.div>

        </div>
        
      </div>

      {/* CONTENT */}
      <div className="px-16 py-16">

        {/* <CategoryChips selected={category} setSelected={setCategory} /> */}
        <div className="flex justify-between items-center">

  <CategoryChips selected={category} setSelected={setCategory} />

  {/* SORT DROPDOWN */}
<select
  value={sortBy}
  onChange={(e) => setSortBy(e.target.value)}
  className="p-2 border rounded-lg text-sm bg-white"
>
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
          <div className="grid grid-cols-4 gap-6 mt-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-6 gap-5 mt-10">
  {paginated.map((vehicle, index) => (
    
    <motion.div
      key={vehicle._id}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.03 }}
      className="transition"
    >
      <VehicleCard
        vehicle={vehicle}
        monthlyBudget={filters.monthlyBudget}
      />
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

  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-xl px-6 py-3 rounded-xl flex items-center gap-6 z-50">

    <span className="font-semibold">
      Compare ({compareList.length}/3)
    </span>

    {compareList.map(v => (

      <div key={v._id} className="relative">

        <img
          src={`http://localhost:5000${v.images[0]}`}
          className="h-10 w-16 object-cover rounded"
        />

        {/* REMOVE BUTTON */}
        <button
          onClick={() => removeFromCompare(v._id)}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-600"
        >
          ✕
        </button>

      </div>

    ))}

    <button
      onClick={()=>navigate("/compare")}
      className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
    >
      Compare
    </button>

  </div>

)}

      <button
        onClick={() => {
          if (!isAuthenticated) navigate("/login")
          else navigate("/add-vehicle")
        }}
        className="fixed bottom-10 right-10 bg-orange-500 text-white
                   px-7 py-4 rounded-full shadow-xl
                   hover:scale-110 transition">
        + Post Free Ad
      </button>

    </div>
  )
}