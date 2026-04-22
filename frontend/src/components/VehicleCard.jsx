import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { calculateMonthlyCost } from "../utils/calculateMonthlyCost"
import { useCompare } from "../context/CompareContext"

export default function VehicleCard({
  vehicle,
  compareList,
  setCompareList,
  monthlyBudget
}) {
  const navigate = useNavigate()
  const { token } = useAuth()

  const estimatedMonthly = calculateMonthlyCost(vehicle)

  const isCityFriendly =
    vehicle.fuelEfficiency > 18 &&
    vehicle.mileage < 80000 &&
    vehicle.maintenanceLevel === "low"

  const { addToCompare } = useCompare()

  // Seller Rating Logic
  let sellerRating = null

  if (vehicle.user) {
    if (vehicle.user.rating) {
      sellerRating = vehicle.user.rating
    } 
    else if (vehicle.trustScore) {
      sellerRating = Math.min(5, (vehicle.trustScore / 20)).toFixed(1)
    }
    else {
      sellerRating = 3.5
    }
  }

  // IMAGE LOGIC
  let imageUrl = "/no-image.png"

  if (vehicle.images && vehicle.images.length > 0) {
    let firstImage = vehicle.images[0]
    if (firstImage.startsWith("/")) firstImage = firstImage.slice(1)
    if (firstImage.startsWith("http")) imageUrl = firstImage
    else if (firstImage.startsWith("uploads/")) imageUrl = `https://motoriq-lk.onrender.com/${firstImage}`
    else imageUrl = `https://motoriq-lk.onrender.com/uploads/${firstImage}`
  }

  return (
    <div
      onClick={() => navigate(`/vehicle/${vehicle._id}`)}
      className="group relative backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer flex flex-col transition-all duration-500"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-glass)',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >

      {/* IMAGE */}
      <div className="relative overflow-hidden">
        {vehicle.images?.length > 0 ? (
          <img
            src={imageUrl}
            alt={`${vehicle.brand || ""} ${vehicle.model || ""}`}
            className="h-44 w-full object-cover group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.target.onerror = null; e.target.src = "/no-image.png" }}
          />
        ) : (
          <div className="h-44 w-full flex items-center justify-center" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)' }}>
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}

        {/* Image overlay */}
        <div className="absolute inset-0" style={{ background: 'var(--card-img-overlay)', opacity: 0.6 }} />

        {/* DEAL SCORE OR PREMIUM */}
        {vehicle.isPremium ? (
          <div className="absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', backdropFilter: 'blur(4px)', boxShadow: '0 4px 12px rgba(234,88,12,0.4)' }}>
            🌟 PREMIUM
          </div>
        ) : vehicle.dealScore > 20 ? (
          <div className="absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1"
            style={{ background: 'rgba(34,197,94,0.9)', backdropFilter: 'blur(4px)' }}>
            🔥 BEST DEAL
          </div>
        ) : null}

        {/* IMAGE COUNT */}
        {vehicle.images?.length > 1 && (
          <div className="absolute bottom-3 right-3 text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            📷 {vehicle.images.length}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4 flex-1 flex flex-col">

        {/* TITLE */}
        <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>
          {vehicle.brand} {vehicle.model}
          <span className="font-normal ml-1" style={{ color: 'var(--text-muted)' }}>{vehicle.manufacturedYear}</span>
        </h3>

        {/* LOCATION */}
        <div className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          📍 {vehicle.city || vehicle.district || "Location N/A"}
        </div>

        {/* PRICE */}
        <p className="font-bold text-lg mt-2" style={{ color: 'var(--primary)' }}>
          LKR {vehicle.price?.toLocaleString()}
        </p>

        {/* SPECS ROW */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : null,
            vehicle.transmission,
            vehicle.fuelType,
          ].filter(Boolean).map((spec, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md"
              style={{ background: 'var(--badge-bg)', border: '1px solid var(--badge-border)', color: 'var(--text-muted)' }}>
              {spec}
            </span>
          ))}
        </div>

        {/* BADGES */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {sellerRating && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'rgba(234,179,8,0.1)', color: 'var(--yellow)' }}>
              ⭐ {sellerRating}
            </span>
          )}
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--purple-glow)', color: 'var(--purple)' }}>
            Trust {vehicle.trustScore ?? 0}
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--blue-glow)', color: 'var(--blue)' }}>
            ~LKR {estimatedMonthly?.toLocaleString()}/mo
          </span>
          {estimatedMonthly <= monthlyBudget && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--green-glow)', color: 'var(--green)' }}>
              ✓ Budget
            </span>
          )}
          {isCityFriendly && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: 'var(--green-glow)', color: 'var(--green)' }}>
              🏙 City
            </span>
          )}
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={async (e) => {
              e.stopPropagation()
              try { await axios.post(`/users/favorite/${vehicle._id}`, {}, { headers: { Authorization: token } }) } catch (err) {}
            }}
            className="flex-1 text-[11px] px-2 py-1.5 rounded-lg font-medium transition-all duration-200"
            style={{ background: 'var(--badge-bg)', border: '1px solid var(--badge-border)', color: 'var(--text-muted)' }}
          >
            ❤️ Save
          </button>
          <button
            onClick={(e)=>{ e.stopPropagation(); addToCompare(vehicle) }}
            className="flex-1 text-[11px] px-2 py-1.5 rounded-lg font-medium transition-all duration-200"
            style={{ background: 'var(--badge-bg)', border: '1px solid var(--badge-border)', color: 'var(--text-muted)' }}
          >
            ⚖ Compare
          </button>
        </div>

      </div>

    </div>
  )
}