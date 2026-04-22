import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "../api/axios"
import Navbar from "../components/Navbar"
import CostChart from "../components/CostChart"
import VehicleCard from "../components/VehicleCard"
import useAuth from "../hooks/useAuth"
import LoanCalculator from "../components/LoanCalculator"
import VehicleGallery from "../components/VehicleGallery"
import VehicleChat from "../components/VehicleChat"
import { calculateMonthlyCost } from "../utils/calculateMonthlyCost"


export default function VehicleDetails() {

  const { id } = useParams()
  const { token } = useAuth()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState(null)
  const [similarVehicles, setSimilarVehicles] = useState([])
  const [recommendedVehicles, setRecommendedVehicles] = useState([])
  const [views, setViews] = useState(0)
  const [reviews, setReviews] = useState([])
  const [reviewText,setReviewText] = useState("")
  const [rating,setRating] = useState(5)

  useEffect(() => {

    const fetchVehicle = async () => {

      const res = await axios.get(`/vehicles/${id}`)
      setVehicle(res.data)

      setViews(res.data.views || 0)

      const similar = await axios.get("/vehicles/search", {
        params: {
          brand: res.data.brand,
          vehicleType: res.data.vehicleType
        }
      })

      setSimilarVehicles(similar.data.filter(v => v._id !== id).slice(0,4))

      /* AI RECOMMENDATIONS */
      const rec = await axios.get(`/vehicles/recommend/${id}`)
      setRecommendedVehicles(rec.data)

      const reviewRes = await axios.get(`/reviews/${id}`)
      setReviews(reviewRes.data)

    }

    fetchVehicle()

  }, [id])

  if (!vehicle) {
    return <div className="p-20 text-center" style={{ color: 'var(--text-muted)' }}>Loading...</div>
  }

  /* ---------- IMAGE LOGIC ---------- */

  let images = vehicle.images || []

  if (!images || images.length === 0) {
    images = ["/no-image.png"]
  }

  const buildImageUrl = (img) => {

    if (!img) return "/no-image.png"

    let image = img

    if (image.startsWith("/")) image = image.slice(1)

    if (image.startsWith("http")) return image

    if (image.startsWith("uploads/"))
      return `https://motoriq-lk.onrender.com/${image}`

    return `https://motoriq-lk.onrender.com/uploads/${image}`
  }

  const processedImages = images.map(img => buildImageUrl(img))

  /* ---------- PRICE CALCULATIONS ---------- */

  const estimatedMonthly = calculateMonthlyCost(vehicle)

  /* ---------- SELLER CONTACT ---------- */

  const phone = vehicle.user?.phone || "94770000000"

  const whatsappLink =
    `https://wa.me/${phone}?text=I'm interested in your vehicle ${vehicle.brand} ${vehicle.model}`

  const shareLink = window.location.href

  /* ---------- ADD REVIEW ---------- */

  const submitReview = async () => {

    const res = await axios.post(
      `/reviews/${vehicle._id}`,
      { rating, comment: reviewText },
      { headers:{Authorization:token} }
    )

    setReviews([...reviews,res.data])
    setReviewText("")
  }
  

  /* ---------- FEATURE LISTS ---------- */

  const generalOptionsList = [
    "Leather Seats",
    "Air Conditioning",
    "Rear Camera",
    "Parking Sensors",
    "Alloy Wheels",
    "Power Steering",
    "Power Windows",
    "Sunroof"
  ]

  const safetyOptionsList = [
    "ABS",
    "Lane Assist",
    "Collision Warning",
    "Blind Spot Monitor",
    "Traction Control",
    "Stability Control",
    "Airbags"
  ]

  const techOptionsList = [
    "Bluetooth",
    "Touch Screen",
    "Digital Dashboard",
    "Apple CarPlay",
    "Navigation System",
    "Android Auto",
    "Keyless Start"
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      <Navbar />

      <div className="max-w-7xl mx-auto p-16 grid grid-cols-2 gap-12">

        {/* LEFT COLUMN */}

        <div>

          <VehicleGallery images={processedImages}/>

          <div className="mt-6 rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>

            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Vehicle Information
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>

              <div><b>Brand:</b> {vehicle.brand}</div>
              <div><b>Model:</b> {vehicle.model}</div>
              <div><b>Vehicle Type:</b> {vehicle.vehicleType}</div>
              <div><b>Condition:</b> {vehicle.condition}</div>
              <div><b>Manufactured Year:</b> {vehicle.manufacturedYear}</div>
              <div><b>Registered Year:</b> {vehicle.registeredYear}</div>
              <div><b>Maintenance Level:</b> {vehicle.maintenanceLevel}</div>
              <div><b>Maintenance Period:</b> {vehicle.maintenancePeriod}</div>
              <div><b>Transmission:</b> {vehicle.transmission}</div>
              <div><b>Fuel Type:</b> {vehicle.fuelType}</div>
              <div><b>Engine Capacity:</b> {vehicle.engineCapacity} cc</div>
              <div><b>Mileage:</b> {vehicle.mileage} km</div>

            </div>


{/* GENERAL OPTIONS */}

<div className="mt-6">

<h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>General Options</h3>

<div className="grid grid-cols-2 gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>

{generalOptionsList.map(opt=>{

const hasFeature = vehicle.options?.includes(opt)

return(
<div key={opt} className="flex gap-2 items-center">
<span style={{ color: hasFeature ? 'var(--green)' : 'var(--red)' }}>
{hasFeature ? "✔":"✖"}
</span>
{opt}
</div>
)

})}

</div>

</div>


{/* SAFETY */}

<div className="mt-6">

<h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Safety Features</h3>

<div className="grid grid-cols-2 gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>

{safetyOptionsList.map(opt=>{

const hasFeature = vehicle.safetyOptions?.includes(opt)

return(
<div key={opt} className="flex gap-2 items-center">
<span style={{ color: hasFeature ? 'var(--green)' : 'var(--red)' }}>
{hasFeature ? "✔":"✖"}
</span>
{opt}
</div>
)

})}

</div>

</div>


{/* TECH */}

<div className="mt-6">

<h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Technology Features</h3>

<div className="grid grid-cols-2 gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>

{techOptionsList.map(opt=>{

const hasFeature = vehicle.techOptions?.includes(opt)

return(
<div key={opt} className="flex gap-2 items-center">
<span style={{ color: hasFeature ? 'var(--green)' : 'var(--red)' }}>
{hasFeature ? "✔":"✖"}
</span>
{opt}
</div>
)

})}

</div>

</div>


{vehicle.additionalInfo && (
<div className="mt-3">
<b>Additional Information:</b>
<p className="whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
{vehicle.additionalInfo}
</p>
</div>
)}

<div className="mt-4">
<b>Location</b>
<p style={{ color: 'var(--text-secondary)' }}>
{vehicle.address}, {vehicle.city}, {vehicle.district}, {vehicle.province}
</p>
</div>

</div>

</div>


{/* RIGHT SIDE */}

<div>

<h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
{vehicle.brand} {vehicle.model} {vehicle.manufacturedYear}
</h1>

<p className="text-2xl font-semibold mb-4" style={{ color: 'var(--primary)' }}>
LKR {vehicle.price}
</p>

{vehicle.dealScore > 20 && (
<div className="px-3 py-1 rounded-lg text-sm inline-block font-medium text-white" style={{ background: 'var(--green)', boxShadow: '0 2px 8px var(--green-glow)' }}>
🔥 Best Deal
</div>
)}

<div className="text-sm mb-4 mt-2" style={{ color: 'var(--text-muted)' }}>
👁 {views} views
</div>

<div className="p-3 rounded-lg mb-4 text-sm" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
🤖 AI Predicted Market Price: <b style={{ color: 'var(--text-primary)' }}>LKR {vehicle.predictedPrice}</b>
</div>

<div className="mt-2 p-4 rounded-lg text-sm" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
📊 Estimated Monthly Cost: <b style={{ color: 'var(--text-primary)' }}>LKR {estimatedMonthly}</b>
</div>


<button
  onClick={async (e) => {

    try {
      await axios.post(
        `/users/favorite/${vehicle._id}`,
        {},
        { headers: { Authorization: token } }
      )

      alert("Added to favorites ❤️")
    } catch (err) {
      console.error(err)
      alert("Failed to add favorite")
    }
  }}
  className="mt-4 px-4 py-2 rounded-lg font-medium transition-all hover:-translate-y-0.5"
  style={{ background: 'var(--red-glow)', color: 'var(--red)', border: '1px solid var(--red)' }}
>
  ❤️ Add to Favorites
</button>

<button
onClick={() => navigator.clipboard.writeText(shareLink)}
className="ml-3 px-4 py-2 rounded" style={{ background: 'var(--chip-bg)', color: 'var(--text-secondary)' }}
>
🔗 Share
</button>


{/* SELLER */}

<div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--bg-glass)' }}>

<h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Seller</h3>

<p
className="cursor-pointer font-medium"
style={{ color: 'var(--blue)' }}
onClick={()=>navigate(`/seller/${vehicle.user?._id}`)}
>
{vehicle.user?.name}
</p>

<p className="text-sm" style={{ color: 'var(--text-muted)' }}>
Rating: {vehicle.user?.rating || 0} ⭐
</p>

<div className="flex gap-3 mt-3">

<a
href={`tel:${phone}`}
className="bg-green-500 text-white px-4 py-2 rounded"
>
Call Seller
</a>

<a
href={whatsappLink}
target="_blank"
className="bg-green-600 text-white px-4 py-2 rounded"
>
WhatsApp
</a>

</div>

</div>


{/* LIVE CHAT */}

<div className="mt-6">
<VehicleChat vehicle={vehicle}/>
</div>


{/* AI GRAPH */}

<div className="mt-8">
<h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>AI Cost Prediction</h3>
<CostChart vehicle={vehicle}/>
</div>


{/* LOAN */}

<div className="mt-8">
<LoanCalculator price={vehicle.price}/>
</div>

</div>

</div>


{/* REVIEWS */}

<div className="max-w-7xl mx-auto px-16">

<h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Reviews</h2>

{reviews.map(r=>(
<div key={r._id} className="p-4 rounded mb-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
⭐ {r.rating} — {r.comment}
</div>
))}

<div className="p-4 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>

<textarea
placeholder="Write review"
value={reviewText}
onChange={(e)=>setReviewText(e.target.value)}
className="input w-full"
/>

<button
onClick={submitReview}
className="mt-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:-translate-y-0.5 transition-all"
style={{ boxShadow: '0 2px 8px var(--primary-glow)' }}
>
Submit Review
</button>

</div>

</div>


{/* AI RECOMMENDED VEHICLES */}

{recommendedVehicles.length > 0 && (

<div className="max-w-7xl mx-auto px-16 pb-20 mt-16">

<h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
Recommended Vehicles
</h2>

<div className="grid grid-cols-4 gap-8">

{recommendedVehicles.map(v => (

<VehicleCard
key={v._id}
vehicle={v}
monthlyBudget={50000}
compareList={[]}
setCompareList={()=>{}}
/>

))}

</div>

</div>

)}


{/* SIMILAR VEHICLES */}

<div className="max-w-7xl mx-auto px-16 pb-20 mt-16">

<h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
Similar Vehicles
</h2>

<div className="grid grid-cols-4 gap-8">

{similarVehicles.map(v => (
<VehicleCard
key={v._id}
vehicle={v}
monthlyBudget={50000}
compareList={[]}
setCompareList={()=>{}}
/>
))}

</div>

</div>

</div>
)
}
