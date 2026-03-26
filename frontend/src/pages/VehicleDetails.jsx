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
    return <div className="p-20 text-center">Loading...</div>
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
      return `http://localhost:5000/${image}`

    return `http://localhost:5000/uploads/${image}`
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
    <div className="bg-gray-100 min-h-screen">

      <Navbar />

      <div className="max-w-7xl mx-auto p-16 grid grid-cols-2 gap-12">

        {/* LEFT COLUMN */}

        <div>

          <VehicleGallery images={processedImages}/>

          <div className="mt-6 bg-white rounded-xl shadow p-6">

            <h2 className="text-xl font-semibold mb-4">
              Vehicle Information
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">

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

<h3 className="font-semibold mb-2">General Options</h3>

<div className="grid grid-cols-2 gap-2 text-sm">

{generalOptionsList.map(opt=>{

const hasFeature = vehicle.options?.includes(opt)

return(
<div key={opt} className="flex gap-2 items-center">
<span className={hasFeature ? "text-green-600":"text-red-500"}>
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

<h3 className="font-semibold mb-2">Safety Features</h3>

<div className="grid grid-cols-2 gap-2 text-sm">

{safetyOptionsList.map(opt=>{

const hasFeature = vehicle.safetyOptions?.includes(opt)

return(
<div key={opt} className="flex gap-2 items-center">
<span className={hasFeature ? "text-green-600":"text-red-500"}>
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

<h3 className="font-semibold mb-2">Technology Features</h3>

<div className="grid grid-cols-2 gap-2 text-sm">

{techOptionsList.map(opt=>{

const hasFeature = vehicle.techOptions?.includes(opt)

return(
<div key={opt} className="flex gap-2 items-center">
<span className={hasFeature ? "text-green-600":"text-red-500"}>
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
<p className="text-gray-600 whitespace-pre-line">
{vehicle.additionalInfo}
</p>
</div>
)}

<div className="mt-4">
<b>Location</b>
<p className="text-gray-600">
{vehicle.address}, {vehicle.city}, {vehicle.district}, {vehicle.province}
</p>
</div>

</div>

</div>


{/* RIGHT SIDE */}

<div>

<h1 className="text-3xl font-bold mb-3">
{vehicle.brand} {vehicle.model} {vehicle.manufacturedYear}
</h1>

<p className="text-orange-600 text-2xl font-semibold mb-4">
LKR {vehicle.price}
</p>

{vehicle.dealScore > 20 && (
<div className="bg-green-500 text-white px-3 py-1 rounded text-sm inline-block">
🔥 Best Deal
</div>
)}

<div className="text-sm text-gray-500 mb-4 mt-2">
👁 {views} views
</div>

<div className="bg-yellow-100 p-3 rounded mb-4 text-sm">
AI Predicted Market Price: <b>LKR {vehicle.predictedPrice}</b>
</div>

<div className="mt-2 p-4 bg-blue-100 rounded-lg text-sm">
Estimated Monthly Cost: <b>LKR {estimatedMonthly}</b>
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
  className="mt-4 bg-red-100 px-4 py-2 rounded hover:bg-red-200"
>
  ❤️ Add to Favorites
</button>

<button
onClick={() => navigator.clipboard.writeText(shareLink)}
className="ml-3 bg-gray-200 px-4 py-2 rounded"
>
🔗 Share
</button>


{/* SELLER */}

<div className="mt-6 p-4 bg-gray-50 rounded-lg">

<h3 className="font-semibold mb-2">Seller</h3>

<p
className="cursor-pointer text-blue-600"
onClick={()=>navigate(`/seller/${vehicle.user?._id}`)}
>
{vehicle.user?.name}
</p>

<p className="text-sm text-gray-500">
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
<h3 className="font-semibold mb-3">AI Cost Prediction</h3>
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

<h2 className="text-2xl font-bold mb-4">Reviews</h2>

{reviews.map(r=>(
<div key={r._id} className="bg-white p-4 rounded shadow mb-3">
⭐ {r.rating} — {r.comment}
</div>
))}

<div className="bg-white p-4 rounded shadow">

<textarea
placeholder="Write review"
value={reviewText}
onChange={(e)=>setReviewText(e.target.value)}
className="w-full border p-2 rounded"
/>

<button
onClick={submitReview}
className="mt-3 bg-orange-500 text-white px-4 py-2 rounded"
>
Submit Review
</button>

</div>

</div>


{/* AI RECOMMENDED VEHICLES */}

{recommendedVehicles.length > 0 && (

<div className="max-w-7xl mx-auto px-16 pb-20 mt-16">

<h2 className="text-2xl font-bold mb-6">
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

<h2 className="text-2xl font-bold mb-6">
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
