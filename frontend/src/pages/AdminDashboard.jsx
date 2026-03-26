import { useEffect, useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import Navbar from "../components/Navbar"
import toast, { Toaster } from "react-hot-toast"

import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts"

export default function AdminDashboard() {

  const { token } = useAuth()

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [flaggedVehicles, setFlaggedVehicles] = useState([])

  /* ================= FETCH STATS ================= */
  const fetchStats = async () => {
    try {
      const res = await axios.get("/admin/stats", {
        headers: { Authorization: token }
      })
      setStats(res.data)
    } catch {
      toast.error("Failed to load stats")
    }
  }

  useEffect(() => {
    fetchStats()
    fetchUsers()      
    fetchVehicles()   

    // Auto refresh every 10s
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [token])

  /* ================= USERS ================= */
  const fetchUsers = async () => {
    try {
      const res = await axios.get("/admin/users", {
        headers: { Authorization: token }
      })
      setUsers(res.data)
    } catch {
      toast.error("Failed to load users")
    }
  }

  /* ================= VEHICLES ================= */
  const fetchVehicles = async () => {
    try {
      const res = await axios.get("/admin/vehicles", {
        headers: { Authorization: token }
      })
      setVehicles(res.data)

      // 🚨 RUN FRAUD DETECTION
      detectFraud(res.data)
    } catch {
      toast.error("Failed to load vehicles")
    }
  }

  const detectFraud = (vehiclesList) => {
  const flagged = []

  vehiclesList.forEach((vehicle, index) => {
    let reasons = []

    // 🚨 1. Price anomaly (too low)
    if (vehicle.price < vehicle.predictedPrice * 0.4) {
      reasons.push("Price too low")
    }

    // 🚨 2. Duplicate listing (same user reposting same vehicle)
    const duplicate = vehiclesList.find((v, i) =>
  i !== index &&
  v.user?._id === vehicle.user?._id &&
  v.brand === vehicle.brand &&
  v.model === vehicle.model &&
  v.year === vehicle.year &&
  v.city === vehicle.city &&
  Math.abs(v.price - vehicle.price) < 50000
)

if (duplicate) {
  reasons.push("Duplicate listing (same seller)")
}

    // 🚨 3. Fake image (basic check)
    if (!vehicle.images || vehicle.images.length === 0) {
      reasons.push("No images")
    }

    if (reasons.length > 0) {
      flagged.push({
        ...vehicle,
        reasons
      })
    }
  })

  setFlaggedVehicles(flagged)
}

// 📥 EXPORT USERS CSV
const exportUsersCSV = () => {
  if (!users.length) return toast.error("No users to export")

  const headers = [
    "Username",
    "Email",
    "Listings",
    "Join Date",
    "Last Login",
    "Trust Score"
  ]

  const rows = users.map(u => [
    u.username || "",
    u.email || "",
    u.listingsCount || 0,
    u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
    u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "",
    u.trustScore || 50
  ])

  const csvContent =
    [headers, ...rows].map(e => e.join(",")).join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = "users.csv"
  link.click()
}

// 📥 EXPORT VEHICLES CSV
const exportVehiclesCSV = () => {
  if (!vehicles.length) return toast.error("No vehicles to export")

  const headers = [
    "Brand",
    "Model",
    "Year",
    "Price",
    "City",
    "Seller",
    "Seller Email"
  ]

  const rows = vehicles.map(v => [
    v.brand || "",
    v.model || "",
    v.manufacturedYear || "",
    v.price || "",
    v.city || "",
    v.user?.username || "",
    v.user?.email || ""
  ])

  const csvContent =
    [headers, ...rows].map(e => e.join(",")).join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = "vehicles.csv"
  link.click()
}

  if (!stats) return <div className="p-10">Loading...</div>

  const pieData = [
    { name: "Buyers", value: stats.totalBuyers },
    { name: "Sellers", value: stats.totalSellers }
  ]

  const growthData = stats.monthlyGrowth.map(item => ({
    month: `${item._id.month}/${item._id.year}`,
    count: item.count
  }))

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster />
      <Navbar />

      <div className="p-10 max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-8">
          Admin Dashboard
        </h1>

        {/* ================= STATS ================= */}
        <div className="grid grid-cols-4 gap-6 mb-10">

          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-2xl shadow-lg">
            <p>Total Users</p>
            <h2 className="text-3xl font-bold">{stats.totalUsers}</h2>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-700 text-white p-6 rounded-2xl shadow-lg">
            <p>Total Vehicles</p>
            <h2 className="text-3xl font-bold">{stats.totalVehicles}</h2>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-700 text-white p-6 rounded-2xl shadow-lg">
            <p>Suspicious</p>
            <h2 className="text-3xl font-bold">{stats.suspiciousListings}</h2>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white p-6 rounded-2xl shadow-lg">
            <p>Avg Price</p>
            <h2 className="text-3xl font-bold">
              LKR {Math.round(stats.averagePrice)}
            </h2>
          </div>

        </div>

        {/* ================= CHARTS ================= */}
        <div className="grid grid-cols-2 gap-10">

          {/* PIE */}
          <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-lg">
            <h3 className="mb-4 font-semibold">Buyer vs Seller</h3>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={100}>
                  <Cell fill="#f97316" />
                  <Cell fill="#3b82f6" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BAR */}
          <div className="bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-lg">
            <h3 className="mb-4 font-semibold">Vehicle Growth</h3>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* 🔥 LINE CHART */}
        <div className="mt-10 bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-lg">
          <h3 className="mb-4 font-semibold">Growth Trend</h3>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ================= ADMIN CONTROLS ================= */}
        <div className="mt-16 bg-white/70 backdrop-blur-lg p-6 rounded-2xl shadow-lg">

          <h2 className="text-xl font-semibold mb-4">Admin Controls</h2>

          <div className="flex gap-4 mb-6 flex-wrap">

  <button
    onClick={fetchUsers}
    className="bg-blue-500 text-white px-4 py-2 rounded-lg">
    Load Users
  </button>

  <button
    onClick={fetchVehicles}
    className="bg-green-500 text-white px-4 py-2 rounded-lg">
    Load Vehicles
  </button>

  {/* 📥 EXPORT USERS */}
  <button
    onClick={exportUsersCSV}
    className="bg-purple-500 text-white px-4 py-2 rounded-lg">
    Export Users
  </button>

  {/* 📥 EXPORT VEHICLES */}
  <button
    onClick={exportVehiclesCSV}
    className="bg-orange-500 text-white px-4 py-2 rounded-lg">
    Export Vehicles
  </button>

</div>

          {/* 🔍 SEARCH */}
          <input
            placeholder="Search users..."
            className="border p-2 rounded-lg mb-4 w-full"
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* USERS */}
          {users.length > 0 && (
            <div className="mb-10">
              <h3 className="font-semibold mb-2">All Users</h3>

              {users
                .filter(u =>
                  (u.username || "").toLowerCase().includes(search.toLowerCase())
                )
                .map(user => (
                  <div key={user._id} className="flex justify-between border-b py-3">

                    <div
                      onClick={() => {
                        setSelectedUser(user)
                        setUserModalOpen(true)
                      }}
                    className="cursor-pointer hover:text-blue-600"
                    >
                    {user.username} ({user.email})

                      <span className={`ml-3 px-2 py-1 text-xs rounded-full
                        ${user.isBanned
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600"}`}>
                        {user.isBanned ? "Banned" : "Active"}
                      </span>
                    </div>

                    <div className="flex gap-4">

                      <button
                        onClick={async () => {
                          await axios.put(`/admin/users/ban/${user._id}`, {}, {
                            headers: { Authorization: token }
                          })
                          toast.success("User banned")
                          fetchUsers()
                        }}
                        className="text-yellow-600 text-sm">
                        Ban
                      </button>

                      <button
                        onClick={async () => {
                          await axios.delete(`/admin/users/${user._id}`, {
                            headers: { Authorization: token }
                          })
                          toast.success("User deleted")
                          setUsers(prev => prev.filter(u => u._id !== user._id))
                        }}
                        className="text-red-600 text-sm">
                        Delete
                      </button>

                    </div>

                  </div>
                ))}
            </div>
          )}

          {/* VEHICLES */}
          {vehicles.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">All Vehicles</h3>

              {vehicles.map(vehicle => (
                <div key={vehicle._id} className="flex justify-between border-b py-3">

                  <div
                    onClick={() => {
                      setSelectedVehicle(vehicle)
                      setVehicleModalOpen(true)
                    }}
                  className="cursor-pointer hover:text-blue-600"
                  >
                    {vehicle.brand} {vehicle.model} - LKR {vehicle.price}
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await axios.delete(`/admin/vehicles/${vehicle._id}`, {
                          headers: { Authorization: token }
                        })

                        toast.success("Vehicle deleted")

                        setVehicles(prev =>
                          prev.filter(v => v._id !== vehicle._id)
                        )

                      } catch {
                        toast.error("Delete failed")
                      }
                    }}
                    className="text-red-600 text-sm">
                    Delete
                  </button>

                </div>
              ))}
            </div>
          )}

          {/* 🚨 SUSPICIOUS LISTINGS PANEL */}
{flaggedVehicles.length > 0 && (
  <div className="mt-10 bg-red-50 border border-red-200 p-6 rounded-2xl shadow-lg">

    <h3 className="font-semibold mb-4 text-red-600">
      ⚠ Suspicious Listings Panel
    </h3>

    {flaggedVehicles.map(vehicle => (
      <div
        key={vehicle._id}
        className="flex justify-between items-center border-b py-3"
      >

        <div>
          <p className="font-medium">
            {vehicle.brand} {vehicle.model}
          </p>

          <p className="text-sm text-gray-500">
            LKR {vehicle.price}
          </p>

          {/* 🚨 REASONS */}
          <div className="flex gap-2 mt-1 flex-wrap">
            {vehicle.reasons.map((reason, i) => (
              <span
                key={i}
                className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        {/* 🔥 ACTION BUTTONS */}
        <div className="flex gap-3">

          {/* 👁 VIEW LISTING */}
          <button
            onClick={() => {
              window.open(`/vehicle/${vehicle._id}`, "_blank")
            }}
            className="text-blue-600 text-sm hover:underline"
          >
            View Listing
          </button>

          {/* 👤 VIEW SELLER */}
          <button
            onClick={() => {
              // adjust if your field is different
              const userId = vehicle.user?._id || vehicle.user
              window.open(`/profile/${userId}`, "_blank")
            }}
            className="text-purple-600 text-sm hover:underline"
          >
            View Seller
          </button>

          {/* 🗑 DELETE */}
          <button
            onClick={async () => {
              try {
                await axios.delete(`/admin/vehicles/${vehicle._id}`, {
                  headers: { Authorization: token }
                })

                toast.success("Listing deleted")

                setFlaggedVehicles(prev =>
                  prev.filter(v => v._id !== vehicle._id)
                )

                setVehicles(prev =>
                  prev.filter(v => v._id !== vehicle._id)
                )

              } catch {
                toast.error("Delete failed")
              }
            }}
            className="text-red-600 text-sm hover:underline"
          >
            Delete
          </button>

        </div>

      </div>
    ))}
  </div>
)}
{/* 👤 USER DETAIL MODAL */}
{userModalOpen && selectedUser && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white p-8 rounded-2xl shadow-xl w-[400px] relative">

      {/* ❌ CLOSE */}
      <button
        onClick={() => setUserModalOpen(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-black"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4">
        User Details
      </h2>

      <div className="space-y-2 text-sm">

        <p><strong>Username:</strong> {selectedUser.username}</p>
        <p><strong>Email:</strong> {selectedUser.email}</p>

        <p>
          <strong>Listings:</strong>{" "}
          {selectedUser.listingsCount || 0}
        </p>

        <p>
          <strong>Join Date:</strong>{" "}
          {selectedUser.createdAt
            ? new Date(selectedUser.createdAt).toLocaleDateString()
            : "N/A"}
        </p>

        <p>
          <strong>Last Login:</strong>{" "}
          {selectedUser.lastLogin
            ? new Date(selectedUser.lastLogin).toLocaleString()
            : "N/A"}
        </p>

        <p>
          <strong>Seller Rating:</strong>{" "}
          <span className={`font-semibold ${
            selectedUser.sellerRating > 4
              ? "text-green-600"
              : selectedUser.sellerRating > 3
              ? "text-green-600"
              : "text-green-600"
          }`}>
            {selectedUser.sellerRating || 5} ⭐
          </span>
        </p>

      </div>

    </div>
  </div>
)}

{/* 🚗 VEHICLE DETAIL MODAL */}
{vehicleModalOpen && selectedVehicle && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className="bg-white p-8 rounded-2xl shadow-xl w-[600px] max-h-[90vh] overflow-y-auto relative">

      {/* ❌ CLOSE */}
      <button
        onClick={() => setVehicleModalOpen(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-black"
      >
        ✕
      </button>

      <h2 className="text-xl font-bold mb-4">
        Vehicle Details
      </h2>

      {/* 🚗 BASIC INFO */}
      <div className="space-y-2 text-sm mb-4">
        <p><strong>Brand:</strong> {selectedVehicle.brand}</p>
        <p><strong>Model:</strong> {selectedVehicle.model}</p>
        <p><strong>Year:</strong> {selectedVehicle.manufacturedYear}</p>
        <p><strong>Price:</strong> LKR {selectedVehicle.price}</p>
        <p><strong>City:</strong> {selectedVehicle.city}</p>
      </div>

      {/* 👤 SELLER INFO */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Seller Info</h3>
        <p><strong>Name:</strong> {selectedVehicle.user?.name || "N/A"}</p>
        <p><strong>Email:</strong> {selectedVehicle.user?.email || "N/A"}</p>

        <p>
          <strong>Trust Score:</strong>{" "}
          <span className={`font-semibold ${
            (selectedVehicle.user?.trustScore || 50) > 70
              ? "text-green-600"
              : (selectedVehicle.user?.trustScore || 50) > 40
              ? "text-yellow-600"
              : "text-red-600"
          }`}>
            {selectedVehicle.user?.trustScore || 50}/100
          </span>
        </p>
      </div>

      {/* 🚨 REPORTS / FLAGS */}
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Reports</h3>

        {selectedVehicle.reasons && selectedVehicle.reasons.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {selectedVehicle.reasons.map((reason, i) => (
              <span
                key={i}
                className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full"
              >
                {reason}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No reports</p>
        )}
      </div>

      {/* 🖼 IMAGES */}
<div>
  <h3 className="font-semibold mb-2">Images</h3>

  {selectedVehicle.images && selectedVehicle.images.length > 0 ? (
    <div className="grid grid-cols-3 gap-3">

      {selectedVehicle.images.map((img, i) => {

        // 🔥 SAME LOGIC AS CARD
        let imageUrl = "/no-image.png"

        if (img) {
          let processedImg = img

          if (processedImg.startsWith("/")) {
            processedImg = processedImg.slice(1)
          }

          if (processedImg.startsWith("http")) {
            imageUrl = processedImg
          }
          else if (processedImg.startsWith("uploads/")) {
            imageUrl = `http://localhost:5000/${processedImg}`
          }
          else {
            imageUrl = `http://localhost:5000/uploads/${processedImg}`
          }
        }

        return (
          <img
            key={i}
            src={imageUrl}
            alt="vehicle"
            className="w-full h-24 object-cover rounded-lg"
            onError={(e) => {
              e.target.onerror = null
              e.target.src = "/no-image.png"
            }}
          />
        )
      })}

    </div>
  ) : (
    <p className="text-gray-500 text-sm">No images</p>
  )}
</div>

    </div>
  </div>
)}

        </div>

      </div>
    </div>
  )
}