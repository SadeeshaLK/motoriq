import { useState, useEffect } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import { useNavigate, useParams } from "react-router-dom"
import { sriLanka } from "../data/sriLankaLocations"
import { brandAndModels } from "../data/brandAndModels"
import Navbar from "../components/Navbar"

export default function EditVehicle() {

const { id } = useParams()
const { token } = useAuth()
const navigate = useNavigate()

const [loading,setLoading] = useState(false)

const [province,setProvince] = useState("")
const [district,setDistrict] = useState("")
const [city,setCity] = useState("")
const [address,setAddress] = useState("")
const [radius,setRadius] = useState(10)

const [form,setForm] = useState({
vehicleType:"",
condition:"",
brand:"",
model:"",
manufacturedYear:"",
registeredYear:"",
maintenanceLevel:"",
maintenancePeriod:"",
price:"",
transmission:"",
fuelType:"",
engineCapacity:"",
mileage:"",
additionalInfo:""
})

const [generalOptions,setGeneralOptions] = useState([])
const [safetyOptions,setSafetyOptions] = useState([])
const [techOptions,setTechOptions] = useState([])

const [existingImages,setExistingImages] = useState([])
const [imagesToDelete,setImagesToDelete] = useState([])
const [newImages,setNewImages] = useState([])

const [dragIndex,setDragIndex] = useState(null)

const generalList=[
"Air Conditioning","Power Steering","Power Windows",
"Leather Seats","Alloy Wheels","Sunroof",
"Rear Camera","Parking Sensors"
]

const safetyList=[
"ABS","Airbags","Traction Control","Lane Assist",
"Blind Spot Monitor","Stability Control","Collision Warning"
]

const techList=[
"Bluetooth","Apple CarPlay","Android Auto",
"Touch Screen","Navigation System",
"Keyless Start","Digital Dashboard"
]

useEffect(()=>{

const fetchVehicle=async()=>{

try{

const res=await axios.get(`/vehicles/${id}`)
const v=res.data

setForm({
vehicleType:v.vehicleType||"",
condition:v.condition||"",
brand:v.brand||"",
model:v.model||"",
manufacturedYear:v.manufacturedYear||"",
registeredYear:v.registeredYear||"",
maintenanceLevel:v.maintenanceLevel||"",
maintenancePeriod:v.maintenancePeriod||"",
price:v.price||"",
transmission:v.transmission||"",
fuelType:v.fuelType||"",
engineCapacity:v.engineCapacity||"",
mileage:v.mileage||"",
additionalInfo:v.additionalInfo||""
})

setProvince(v.province||"")
setDistrict(v.district||"")
setCity(v.city||"")
setAddress(v.address||"")

if(v.options){
if(Array.isArray(v.options)) setGeneralOptions(v.options)
else setGeneralOptions(v.options.split(",").map(o=>o.trim()))
}

if(v.safetyOptions){
if(Array.isArray(v.safetyOptions)) setSafetyOptions(v.safetyOptions)
else setSafetyOptions(v.safetyOptions.split(",").map(o=>o.trim()))
}

if(v.techOptions){
if(Array.isArray(v.techOptions)) setTechOptions(v.techOptions)
else setTechOptions(v.techOptions.split(",").map(o=>o.trim()))
}

setExistingImages(v.images||[])

}catch(err){
console.log(err)
}

}

fetchVehicle()

},[id])

const handleChange=(e)=>{
setForm({...form,[e.target.name]:e.target.value})
}

const toggleOption=(list,setter,value)=>{
if(list.includes(value)){
setter(list.filter(v=>v!==value))
}else{
setter([...list,value])
}
}

/* IMAGE UPLOAD */

const handleNewImages=(e)=>{

const files=Array.from(e.target.files)

const mapped=files.map(file=>({
file,
preview:URL.createObjectURL(file)
}))

setNewImages([...newImages,...mapped])

}

const removeNewImage=(index)=>{
const updated=[...newImages]
updated.splice(index,1)
setNewImages(updated)
}

const deleteExistingImage=(img)=>{

setExistingImages(existingImages.filter(i=>i!==img))
setImagesToDelete([...imagesToDelete,img])

}

/* DRAG REORDER */

const handleDragStart=(index)=>{
setDragIndex(index)
}

const handleDrop=(index)=>{

if(dragIndex===null) return

let images=[...existingImages]

const dragged=images[dragIndex]
images.splice(dragIndex,1)
images.splice(index,0,dragged)

setExistingImages(images)
setDragIndex(null)

}

/* SUBMIT */

const handleSubmit=async(e)=>{

e.preventDefault()

if(!province||!district||!city){
return alert("Please select Province, District and City")
}

setLoading(true)

const data=new FormData()

data.append("province",province)
data.append("district",district)
data.append("city",city)
data.append("address",address)
data.append("radius",radius)

Object.keys(form).forEach(key=>{
data.append(key,form[key])
})

data.append("options",generalOptions.join(", "))
data.append("safetyOptions",safetyOptions.join(", "))
data.append("techOptions",techOptions.join(", "))

data.append("imagesToDelete",JSON.stringify(imagesToDelete))

data.append("imageOrder",JSON.stringify(existingImages))

newImages.forEach(img=>{
data.append("images",img.file)
})

try{

await axios.put(`/vehicles/${id}`,data,{
headers:{
Authorization:token,
"Content-Type":"multipart/form-data"
}
})

alert("Vehicle Updated Successfully")
navigate("/account")

}catch(err){
alert("Update failed")
}

setLoading(false)

}

return(

<div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-700">

    <Navbar />

    <div className="p-16 flex justify-center">

<form
onSubmit={handleSubmit}
className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-4xl space-y-6"
>

<h2 className="text-3xl font-bold text-gray-800 mb-6">
Edit Vehicle
</h2>

{/* LOCATION */}

<div className="grid grid-cols-3 gap-6">

<select className="input" value={province}
onChange={(e)=>{
setProvince(e.target.value)
setDistrict("")
setCity("")
}}>
<option value="">Select Province</option>
{Object.keys(sriLanka).map(prov=>(
<option key={prov}>{prov}</option>
))}
</select>

<select className="input" value={district}
onChange={(e)=>{
setDistrict(e.target.value)
setCity("")
}} disabled={!province}>
<option value="">Select District</option>
{province &&
Object.keys(sriLanka[province]).map(dist=>(
<option key={dist}>{dist}</option>
))}
</select>

<select className="input" value={city}
onChange={(e)=>setCity(e.target.value)}
disabled={!district}>
<option value="">Select City</option>
{district &&
sriLanka[province][district].map(c=>(
<option key={c}>{c}</option>
))}
</select>

</div>

{/* VEHICLE DETAILS */}

<div className="grid grid-cols-2 gap-6">

<select name="vehicleType" value={form.vehicleType} className="input" onChange={handleChange}>
<option value="">Vehicle Type</option>
<option>SUV</option>
<option>Sedan</option>
<option>Hatchback</option>
<option>Pickup</option>
<option>Van</option>
<option>Hybrid</option>
<option>Electric</option>
</select>

<select name="condition" value={form.condition} className="input" onChange={handleChange}>
<option value="">Condition</option>
<option>Brand New</option>
<option>Used</option>
<option>Reconditioned</option>
</select>

<select
className="input"
value={form.brand}
onChange={(e)=>setForm({...form,brand:e.target.value,model:""})}
>
<option value="">Select Brand</option>
{Object.keys(brandAndModels).map((brand)=>(
<option key={brand}>{brand}</option>
))}
</select>

<select
className="input"
value={form.model}
onChange={(e)=>setForm({...form,model:e.target.value})}
disabled={!form.brand}
>
<option value="">Select Model</option>
{form.brand &&
brandAndModels[form.brand].map(model=>(
<option key={model}>{model}</option>
))
}
</select>

<input type="number" name="manufacturedYear" value={form.manufacturedYear} className="input" onChange={handleChange}/>
<input type="number" name="registeredYear" value={form.registeredYear} className="input" onChange={handleChange}/>

<select name="maintenanceLevel" value={form.maintenanceLevel} className="input" onChange={handleChange}>
<option value="">Maintenance Level</option>
<option value="low">Low</option>
<option value="medium">Medium</option>
<option value="high">High</option>
</select>

<select name="maintenancePeriod" value={form.maintenancePeriod} className="input" onChange={handleChange}>
<option value="">Maintenance Period</option>
<option value="3 months">3 Months</option>
<option value="6 months">6 Months</option>
<option value="1 year">1 Year</option>
</select>

<input type="number" name="price" value={form.price} className="input" onChange={handleChange}/>

<select name="transmission" value={form.transmission} className="input" onChange={handleChange}>
<option value="">Transmission</option>
<option>Automatic</option>
<option>Manual</option>
<option>CVT</option>
</select>

<select name="fuelType" value={form.fuelType} className="input" onChange={handleChange}>
<option value="">Fuel Type</option>
<option>Petrol</option>
<option>Diesel</option>
<option>Hybrid</option>
<option>Electric</option>
</select>

<input type="number" name="engineCapacity" value={form.engineCapacity} className="input" onChange={handleChange}/>
<input type="number" name="mileage" value={form.mileage} className="input" onChange={handleChange}/>

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

{/* IMAGES */}

<div>

<label className="block mb-3 font-semibold text-gray-700">
Vehicle Images (Drag to reorder)
</label>

<div className="grid grid-cols-5 gap-4 mb-4">

{existingImages.map((img,index)=>{

const imageUrl=img.startsWith("http")
?img
:`http://localhost:5000/${img.replace(/^\/+/,"")}`

return(

<div
key={index}
draggable
onDragStart={()=>handleDragStart(index)}
onDragOver={(e)=>e.preventDefault()}
onDrop={()=>handleDrop(index)}
className="relative border rounded-lg overflow-hidden cursor-move"
>

<img src={imageUrl} className="h-24 w-full object-cover"/>

{index===0 && (
<div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
Primary
</div>
)}

<button
type="button"
onClick={()=>deleteExistingImage(img)}
className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
>
Delete
</button>

</div>

)

})}

{newImages.map((img,index)=>(
<div key={index} className="relative border rounded-lg overflow-hidden">

<img src={img.preview} className="h-24 w-full object-cover"/>

<button
type="button"
onClick={()=>removeNewImage(index)}
className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
>
Delete
</button>

</div>
))}

</div>

<input
type="file"
multiple
accept="image/*"
onChange={handleNewImages}
className="block w-full border p-3 rounded-lg"
/>

</div>

<button
disabled={loading}
className="w-full bg-orange-500 text-white p-4 rounded-xl hover:bg-orange-600 transition font-semibold"
>
{loading ? "Updating..." : "Update Vehicle"}
</button>

</form>

</div>

</div>

)

}