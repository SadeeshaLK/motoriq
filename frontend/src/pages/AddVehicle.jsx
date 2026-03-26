import { useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import { useNavigate } from "react-router-dom"
import { sriLanka } from "../data/sriLankaLocations"
import { brandAndModels } from "../data/brandAndModels"
import Navbar from "../components/Navbar"

export default function AddVehicle() {

  const { token } = useAuth()
  const navigate = useNavigate()

  /* ---------------- LOCATION STATES ---------------- */
  const [province, setProvince] = useState("")
  const [district, setDistrict] = useState("")
  const [city, setCity] = useState("")
  const [address, setAddress] = useState("")
  const [radius, setRadius] = useState(10)

  const [coordinates, setCoordinates] = useState({
    lat: "",
    lng: ""
  })

  /* ---------------- FORM STATES ---------------- */
  const [form, setForm] = useState({
    vehicleType: "",
    condition: "",
    make: "",
    model: "",
    manufacturedYear: "",
    registeredYear: "",
    maintenanceLevel: "",
    maintenancePeriod: "",
    price: "",
    transmission: "",
    fuelType: "",
    engineCapacity: "",
    mileage: "",
    options: "",
    safetyOptions: "",
    techOptions: "",
    additionalInfo: ""
  })

  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)

  /* ---------------- OPTION STATES ---------------- */

  const [generalOptions, setGeneralOptions] = useState([])
  const [safetyOptions, setSafetyOptions] = useState([])
  const [techOptions, setTechOptions] = useState([])

  const generalList = [
    "Air Conditioning",
    "Power Steering",
    "Power Windows",
    "Leather Seats",
    "Alloy Wheels",
    "Sunroof",
    "Rear Camera",
    "Parking Sensors"
  ]

  const safetyList = [
    "ABS",
    "Airbags",
    "Traction Control",
    "Lane Assist",
    "Blind Spot Monitor",
    "Stability Control",
    "Collision Warning"
  ]

  const techList = [
    "Bluetooth",
    "Apple CarPlay",
    "Android Auto",
    "Touch Screen",
    "Navigation System",
    "Keyless Start",
    "Digital Dashboard"
  ]

  const [dragIndex, setDragIndex] = useState(null)

  const toggleOption = (list,setter,value) => {

    if(list.includes(value)){
      setter(list.filter(v=>v!==value))
    } else {
      setter([...list,value])
    }

  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  /* ---------------- IMAGE UPLOAD ---------------- */

  const handleImageChange = (e) => {

    const files = Array.from(e.target.files)

    if (images.length + files.length > 5) {
      alert("Maximum 5 images allowed")
      return
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setImages([...images, ...newImages])
  }

  const removeImage = (index) => {

    const updated = [...images]
    updated.splice(index,1)

    setImages(updated)
  }

  const moveImageLeft = (index) => {

    if(index === 0) return

    const updated = [...images]
    ;[updated[index-1],updated[index]] = [updated[index],updated[index-1]]

    setImages(updated)
  }

  const moveImageRight = (index) => {

    if(index === images.length-1) return

    const updated = [...images]
    ;[updated[index+1],updated[index]] = [updated[index],updated[index+1]]

    setImages(updated)
  }

  const handleDragStart = (index) => {
  setDragIndex(index)
}

const handleDrop = (index) => {

  if (dragIndex === null) return

  const updated = [...images]

  const dragged = updated[dragIndex]

  updated.splice(dragIndex,1)

  updated.splice(index,0,dragged)

  setImages(updated)

  setDragIndex(null)

}

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {

    e.preventDefault()

    if (!token) return navigate("/login")

    if (!province || !district || !city) {
      return alert("Please select Province, District and City")
    }

    setLoading(true)

    const data = new FormData()

    /* Location Data */
    data.append("province", province)
    data.append("district", district)
    data.append("city", city)
    data.append("address", address)
    data.append("radius", radius)

    if (coordinates.lat && coordinates.lng) {
      data.append("location", JSON.stringify({
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng)
      }))
    }

    /* Vehicle Data */
    Object.keys(form).forEach(key => {
      data.append(key, form[key])
    })

    data.append("options", generalOptions.join(", "))
    data.append("safetyOptions", safetyOptions.join(", "))
    data.append("techOptions", techOptions.join(", "))

    images.forEach(img => {
      data.append("images", img.file)
    })

    try {

      await axios.post("/vehicles", data, {
        headers: {
          Authorization: token,
          "Content-Type": "multipart/form-data"
        }
      })

      alert("Vehicle Posted Successfully")
      navigate("/")

    } catch (err) {

      alert("Error posting vehicle")

    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700">

    <Navbar />

    <div className="p-16 flex justify-center">

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-4xl space-y-6"
      >

        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Post New Vehicle
        </h2>

        {/* Province / District / City */}
        <div className="grid grid-cols-3 gap-6">

          <select
            className="input"
            value={province}
            onChange={(e) => {
              setProvince(e.target.value)
              setDistrict("")
              setCity("")
            }}
            required
          >
            <option value="">Select Province</option>
            {Object.keys(sriLanka).map(prov => (
              <option key={prov}>{prov}</option>
            ))}
          </select>

          <select
            className="input"
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value)
              setCity("")
            }}
            disabled={!province}
            required
          >
            <option value="">Select District</option>
            {province &&
              Object.keys(sriLanka[province]).map(dist => (
                <option key={dist}>{dist}</option>
              ))}
          </select>

          <select
            className="input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!district}
            required
          >
            <option value="">Select City</option>
            {district &&
              sriLanka[province][district].map(c => (
                <option key={c}>{c}</option>
              ))}
          </select>

        </div>

        {/* ---------------- VEHICLE DETAILS ---------------- */}
        <div className="grid grid-cols-2 gap-6">

          <select name="vehicleType" className="input" onChange={handleChange} required>
            <option value="">Vehicle Type</option>
            <option>SUV</option>
            <option>Sedan</option>
            <option>Hatchback</option>
            <option>Pickup</option>
            <option>Van</option>
            <option>Hybrid</option>
            <option>Electric</option>
          </select>

          <select name="condition" className="input" onChange={handleChange} required>
            <option value="">Condition</option>
            <option>Brand New</option>
            <option>Used</option>
            <option>Reconditioned</option>
          </select>

          <select
            className="input"
            value={form.brand}
            onChange={(e) =>
              setForm({
                ...form,
                brand: e.target.value,
                model: ""
              })
            }
            required
          >
            <option value="">Select Brand</option>
            {Object.keys(brandAndModels).map((brand) => (
              <option key={brand}>{brand}</option>
            ))}
          </select>

          <select
            className="input"
            value={form.model}
            onChange={(e) =>
              setForm({
                ...form,
                model: e.target.value
              })
            }
            disabled={!form.brand}
            required
          >
            <option value="">Select Model</option>

            {form.brand &&
              brandAndModels[form.brand].map((model) => (
                <option key={model}>{model}</option>
              ))}
          </select>

          <input type="number" name="manufacturedYear" placeholder="Manufactured Year" className="input" onChange={handleChange} required />
          <input type="number" name="registeredYear" placeholder="Registered Year" className="input" onChange={handleChange} />

          <select name="maintenanceLevel" className="input" onChange={handleChange} required>
            <option value="">Maintenance Level</option>
            <option value="low">Low (Service Cost around Rs. 25,000 - 30,000)</option>
            <option value="medium">Medium (Service Cost around Rs. 30,000 - 50,000)</option>
            <option value="high">High (Service Cost around Rs. 50,000 - 100,000)</option>
          </select>

            <select name="maintenancePeriod" className="input" onChange={handleChange} required>
              <option value="">Maintenance Period</option>
              <option value="3 months">3 Months</option>
              <option value="6 months">6 Months</option>
              <option value="1 year">1 Year</option>
            </select>


          <input type="number" name="price" placeholder="Price (Rs.)" className="input" onChange={handleChange} required />

          <select name="transmission" className="input" onChange={handleChange}>
            <option value="">Transmission</option>
            <option>Automatic</option>
            <option>Manual</option>
            <option>CVT</option>
          </select>

          <select name="fuelType" className="input" onChange={handleChange}>
            <option value="">Fuel Type</option>
            <option>Petrol</option>
            <option>Diesel</option>
            <option>Hybrid</option>
            <option>Electric</option>
          </select>

          <input type="number" name="engineCapacity" placeholder="Engine Capacity (cc)" className="input" onChange={handleChange} />
          <input type="number" name="mileage" placeholder="Mileage (km)" className="input" onChange={handleChange} />

        </div>

        {/* GENERAL OPTIONS */}

        <div>
          <h3 className="font-semibold mb-2">General Options</h3>
          <div className="grid grid-cols-3 gap-2">

            {generalList.map(opt=>(
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generalOptions.includes(opt)}
                  onChange={()=>toggleOption(generalOptions,setGeneralOptions,opt)}
                />
                {opt}
              </label>
            ))}

          </div>
        </div>

        {/* SAFETY OPTIONS */}

        <div>
          <h3 className="font-semibold mb-2">Safety Options</h3>
          <div className="grid grid-cols-3 gap-2">

            {safetyList.map(opt=>(
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={safetyOptions.includes(opt)}
                  onChange={()=>toggleOption(safetyOptions,setSafetyOptions,opt)}
                />
                {opt}
              </label>
            ))}

          </div>
        </div>

        {/* TECH OPTIONS */}

        <div>
          <h3 className="font-semibold mb-2">Tech Options</h3>
          <div className="grid grid-cols-3 gap-2">

            {techList.map(opt=>(
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={techOptions.includes(opt)}
                  onChange={()=>toggleOption(techOptions,setTechOptions,opt)}
                />
                {opt}
              </label>
            ))}

          </div>
        </div>

        {/* ADDITIONAL INFO */}

        <textarea
          name="additionalInfo"
          placeholder="Additional Information"
          className="input h-24"
          onChange={handleChange}
        />

        {/* IMAGE UPLOAD */}

        {/* IMAGE UPLOAD */}

<div>

  <label className="block mb-2 font-medium">
    Upload Vehicle Images (Max 5)
  </label>

  {/* IMAGE GRID */}

  {images.length > 0 && (

    <div className="grid grid-cols-5 gap-4 mb-4">

      {images.map((img,index)=>(

        <div
          key={index}
          draggable
          onDragStart={()=>handleDragStart(index)}
          onDragOver={(e)=>e.preventDefault()}
          onDrop={()=>handleDrop(index)}
          className="relative border rounded-lg overflow-hidden cursor-move group"
        >

          <img
            src={img.preview}
            className="h-24 w-full object-cover"
          />

          {/* PRIMARY BADGE */}

          {index === 0 && (
            <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
              Primary
            </div>
          )}

          {/* DELETE BUTTON */}

          <button
            type="button"
            onClick={()=>removeImage(index)}
            className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
          >
            Delete
          </button>

        </div>

      ))}

    </div>

  )}

  {/* FILE INPUT */}

  <input
    type="file"
    multiple
    accept="image/*"
    onChange={handleImageChange}
    className="block w-full border p-3 rounded-lg"
  />

</div>

        <button
          disabled={loading}
          className="w-full bg-orange-500 text-white p-4 rounded-xl hover:bg-orange-600 transition font-semibold"
        >
          {loading ? "Posting..." : "Submit Vehicle"}
        </button>

      </form>

    </div>

    </div>
  )
}
