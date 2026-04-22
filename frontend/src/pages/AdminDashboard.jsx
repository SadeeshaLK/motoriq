import { useEffect, useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"
import toast, { Toaster } from "react-hot-toast"

import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts"

const COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7"]

const StatCard = ({ label, value, icon, color }) => (
  <div className="p-6 rounded-2xl text-white relative overflow-hidden"
    style={{ background: color, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
    <div className="text-3xl mb-1">{icon}</div>
    <p className="text-sm opacity-80">{label}</p>
    <h2 className="text-3xl font-bold mt-1">{value ?? "—"}</h2>
    <div className="absolute -right-4 -bottom-4 text-6xl opacity-10">{icon}</div>
  </div>
)

export default function AdminDashboard() {

  const { token } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [flaggedVehicles, setFlaggedVehicles] = useState([])
  const [pendingBoosts, setPendingBoosts] = useState([])

  const [activeTab, setActiveTab] = useState("overview")
  const [search, setSearch] = useState("")
  const [userFilter, setUserFilter] = useState("all")

  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  // Broadcast notification state
  const [broadcastText, setBroadcastText] = useState("")
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastType, setBroadcastType] = useState("system")
  const [broadcastTarget, setBroadcastTarget] = useState("all")
  const [sendingBroadcast, setSendingBroadcast] = useState(false)

  /* ===== FETCH ===== */

  const fetchStats = async () => {
    try {
      const res = await axios.get("/admin/stats", { headers: { Authorization: token } })
      setStats(res.data)
    } catch {
      toast.error("Failed to load stats")
    }
  }

  const fetchUsers = async (search = "", filter = "all") => {
    try {
      let url = `/admin/users?search=${search}`
      if (filter !== "all") url += `&status=${filter}`
      const res = await axios.get(url, { headers: { Authorization: token } })
      setUsers(res.data)
    } catch {
      toast.error("Failed to load users")
    }
  }

  const fetchVehicles = async (search = "") => {
    try {
      const res = await axios.get(`/admin/vehicles?search=${search}`, { headers: { Authorization: token } })
      setVehicles(res.data)
      detectFraud(res.data)
    } catch {
      toast.error("Failed to load vehicles")
    }
  }

  const fetchPendingBoosts = async () => {
    try {
      const res = await axios.get("/admin/boosts/pending", { headers: { Authorization: token } })
      setPendingBoosts(res.data)
    } catch {
      toast.error("Failed to load pending boosts")
    }
  }

  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchVehicles()
    fetchPendingBoosts()
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [token])

  /* ===== FRAUD DETECTION ===== */

  const detectFraud = (vehiclesList) => {
    const flagged = []
    vehiclesList.forEach((vehicle, index) => {
      let reasons = []
      if (vehicle.price < vehicle.predictedPrice * 0.4) reasons.push("Price too low vs AI prediction")
      const dup = vehiclesList.find((v, i) =>
        i !== index && v.user?._id === vehicle.user?._id &&
        v.brand === vehicle.brand && v.model === vehicle.model &&
        Math.abs(v.price - vehicle.price) < 50000
      )
      if (dup) reasons.push("Duplicate listing")
      if (!vehicle.images || vehicle.images.length === 0) reasons.push("No images")
      if (reasons.length > 0) flagged.push({ ...vehicle, reasons })
    })
    setFlaggedVehicles(flagged)
  }

  /* ===== CSV EXPORT ===== */

  const exportCSV = (headers, rows, filename) => {
    const csvContent = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(","),
      ...rows.map(r => r.map(field => `"${String(field || "").replace(/"/g, '""')}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const exportUsersCSV = () => {
    if (!users.length) return toast.error("No users to export")
    exportCSV(
      ["Name", "Email", "Phone", "City", "Listings", "Total Reviews", "Joined", "Last Login", "Trust Score", "Admin", "Banned"],
      users.map(u => [
        u.name, 
        u.email, 
        u.phone || "N/A",
        u.city || "N/A",
        u.listingsCount, 
        u.totalReviews || 0,
        u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "", 
        u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "", 
        u.trustScore || 50, 
        u.isAdmin ? "Yes" : "No",
        u.isBanned ? "Yes" : "No"
      ]),
      "users.csv"
    )
  }

  const exportVehiclesCSV = () => {
    if (!vehicles.length) return toast.error("No vehicles to export")
    exportCSV(
      ["Brand", "Model", "Year", "Price", "Condition", "Type", "Fuel", "Transmission", "Mileage", "Engine (cc)", "Province", "District", "City", "Views", "Premium", "Seller", "Seller Email", "Posted Date"],
      vehicles.map(v => [
        v.brand, 
        v.model, 
        v.manufacturedYear, 
        v.price, 
        v.condition,
        v.vehicleType,
        v.fuelType,
        v.transmission,
        v.mileage,
        v.engineCapacity || "N/A",
        v.province || "N/A",
        v.district || "N/A",
        v.city, 
        v.views || 0,
        v.isPremium ? "Yes" : "No",
        v.user?.name, 
        v.user?.email,
        v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ""
      ]),
      "vehicles.csv"
    )
  }

  /* ===== BROADCAST NOTIFICATIONS ===== */

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return toast.error("Message text is required")
    setSendingBroadcast(true)
    try {
      let userIds = []
      if (broadcastTarget === "all") {
        userIds = users.map(u => u._id)
      } else if (broadcastTarget === "banned") {
        userIds = users.filter(u => u.isBanned).map(u => u._id)
      } else if (broadcastTarget === "sellers") {
        userIds = users.filter(u => u.listingsCount > 0).map(u => u._id)
      }

      if (!userIds.length) {
        toast.error("No users match the target")
        setSendingBroadcast(false)
        return
      }

      await axios.post("/admin/notify", {
        userIds,
        title: broadcastTitle || "Admin Notification",
        text: broadcastText,
        type: broadcastType,
        link: "/"
      }, { headers: { Authorization: token } })

      toast.success(`Notification sent to ${userIds.length} users`)
      setBroadcastText("")
      setBroadcastTitle("")
    } catch {
      toast.error("Failed to send notification")
    }
    setSendingBroadcast(false)
  }

  /* ===== USER ACTIONS ===== */

  const banUser = async (userId) => {
    try {
      const res = await axios.put(`/admin/users/ban/${userId}`, {}, { headers: { Authorization: token } })
      toast.success(res.data.isBanned ? "User banned" : "User unbanned")
      fetchUsers(search, userFilter)
    } catch {
      toast.error("Failed to ban user")
    }
  }

  const toggleAdmin = async (userId) => {
    try {
      const res = await axios.put(`/admin/users/admin/${userId}`, {}, { headers: { Authorization: token } })
      toast.success(res.data.message)
      fetchUsers(search, userFilter)
    } catch {
      toast.error("Failed to toggle admin")
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user and all their listings?")) return
    try {
      await axios.delete(`/admin/users/${userId}`, { headers: { Authorization: token } })
      toast.success("User deleted")
      setUsers(prev => prev.filter(u => u._id !== userId))
      setSelectedUser(null)
    } catch {
      toast.error("Failed to delete user")
    }
  }

  const deleteVehicle = async (vehicleId) => {
    if (!window.confirm("Delete this vehicle listing?")) return
    try {
      await axios.delete(`/admin/vehicles/${vehicleId}`, { headers: { Authorization: token } })
      toast.success("Vehicle deleted")
      setVehicles(prev => prev.filter(v => v._id !== vehicleId))
      setSelectedVehicle(null)
    } catch {
      toast.error("Failed to delete vehicle")
    }
  }

  const handleBoostAction = async (id, action) => {
    try {
      if(action === "approve") {
         await axios.put(`/admin/boosts/${id}/approve`, {}, { headers: { Authorization: token } })
         toast.success("Boost approved! Ad is now premium.")
      } else {
         await axios.put(`/admin/boosts/${id}/reject`, {}, { headers: { Authorization: token } })
         toast.success("Boost rejected.")
      }
      fetchPendingBoosts()
    } catch(err) {
      toast.error("Failed to process boost")
    }
  }

  /* ===== EARLY RETURN ===== */

  if (!stats) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-body)' }}>
      <div className="text-center">
        <div className="text-4xl mb-4 animate-pulse">🛡</div>
        <p style={{ color: 'var(--text-muted)' }}>Loading admin dashboard...</p>
      </div>
    </div>
  )

  const pieData = [
    { name: "Buyers", value: stats.totalBuyers },
    { name: "Sellers", value: stats.totalSellers }
  ]

  const growthData = stats.monthlyGrowth.map(item => ({
    month: `${item._id.month}/${item._id.year}`,
    count: item.count
  }))

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    if (userFilter === "banned") return matchSearch && u.isBanned
    if (userFilter === "admin") return matchSearch && u.isAdmin
    return matchSearch
  })

  /* ===== TAB NAVIGATION ===== */

  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "users", label: "👥 Users" },
    { key: "vehicles", label: "🚗 Vehicles" },
    { key: "fraud", label: `🚨 Fraud (${flaggedVehicles.length})` },
    { key: "boosts", label: `🌟 Boosts (${pendingBoosts.length})` },
    { key: "notify", label: "📢 Broadcast" },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>
      <Toaster />
      <Navbar />

      <div className="p-8 max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>🛡 Admin Dashboard</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>MotorIQ platform management</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportUsersCSV}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
              📥 Export Users
            </button>
            <button onClick={exportVehiclesCSV}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
              📥 Export Vehicles
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard label="Total Users" value={stats.totalUsers} icon="👥" color="linear-gradient(135deg, #3b82f6, #1d4ed8)" />
          <StatCard label="Total Vehicles" value={stats.totalVehicles} icon="🚗" color="linear-gradient(135deg, #22c55e, #15803d)" />
          <StatCard label="Suspicious" value={stats.suspiciousListings} icon="🚨" color="linear-gradient(135deg, #ef4444, #b91c1c)" />
          <StatCard label="Avg Price" value={`LKR ${Math.round(stats.averagePrice).toLocaleString()}`} icon="💰" color="linear-gradient(135deg, #f97316, #ea580c)" />
        </div>

        {/* Weekly Stats */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          <div className="p-4 rounded-xl flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="text-2xl">🆕</div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>New Users (7 days)</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.newUsersThisWeek ?? 0}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="text-2xl">🚗</div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>New Listings (7 days)</p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{stats.newVehiclesThisWeek ?? 0}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl flex items-center gap-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}>
            <div className="text-2xl">🚫</div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Banned Users</p>
              <p className="text-xl font-bold" style={{ color: 'var(--red)' }}>{stats.bannedUsers ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={activeTab === tab.key
                ? { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', boxShadow: '0 2px 8px var(--primary-glow)' }
                : { background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }
              }>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== TAB: OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl backdrop-blur-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Buyer vs Seller Split</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="p-6 rounded-2xl backdrop-blur-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>
                <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Vehicle Growth</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={growthData}>
                    <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#f97316" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-2xl backdrop-blur-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Platform Growth Trend</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={growthData}>
                  <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ===== TAB: USERS ===== */}
        {activeTab === "users" && (
          <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

            <div className="flex gap-3 mb-4 flex-wrap">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); fetchUsers(e.target.value, userFilter) }}
                placeholder="Search by name or email..."
                className="input flex-1"
              />
              {["all","banned","admin"].map(f => (
                <button key={f} onClick={() => { setUserFilter(f); fetchUsers(search, f) }}
                  className="px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                  style={userFilter === f
                    ? { background: 'var(--primary)', color: 'white' }
                    : { background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }
                  }>
                  {f}
                </button>
              ))}
              <button onClick={() => fetchUsers(search, userFilter)}
                className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                🔄 Refresh
              </button>
            </div>

            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{filteredUsers.length} users</p>

            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div key={user._id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{ border: '1px solid var(--border-subtle)', background: selectedUser?._id === user._id ? 'var(--bg-glass-hover)' : 'transparent' }}>

                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedUser(selectedUser?._id === user._id ? null : user)}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: user.isAdmin ? 'linear-gradient(135deg,#f97316,#ea580c)' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
                      {user.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        {user.name}
                        {user.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>Admin</span>}
                        {user.isBanned && <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--red-glow)', color: 'var(--red)' }}>Banned</span>}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email} • {user.listingsCount} listings</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/seller/${user._id}`)}
                      className="text-xs px-2 py-1 rounded-lg transition-all"
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                      View
                    </button>
                    <button onClick={() => toggleAdmin(user._id)}
                      className="text-xs px-2 py-1 rounded-lg transition-all"
                      style={{ background: 'var(--blue-glow)', color: 'var(--blue)' }}>
                      {user.isAdmin ? "Revoke Admin" : "Make Admin"}
                    </button>
                    <button onClick={() => banUser(user._id)}
                      className="text-xs px-2 py-1 rounded-lg transition-all"
                      style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                      {user.isBanned ? "Unban" : "Ban"}
                    </button>
                    <button onClick={() => deleteUser(user._id)}
                      className="text-xs px-2 py-1 rounded-lg transition-all"
                      style={{ background: 'var(--red-glow)', color: 'var(--red)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ===== TAB: VEHICLES ===== */}
        {activeTab === "vehicles" && (
          <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

            <div className="flex gap-3 mb-4">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); fetchVehicles(e.target.value) }}
                placeholder="Search by brand or model..."
                className="input flex-1"
              />
              <button onClick={() => fetchVehicles(search)}
                className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                🔄 Refresh
              </button>
            </div>

            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{vehicles.length} vehicles</p>

            <div className="space-y-2">
              {vehicles.map(v => (
                <div key={v._id}
                  className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
                  style={{ border: '1px solid var(--border-subtle)', background: selectedVehicle?._id === v._id ? 'var(--bg-glass-hover)' : 'transparent' }}
                  onClick={() => setSelectedVehicle(selectedVehicle?._id === v._id ? null : v)}>

                  <div className="flex items-center gap-3">
                    <img src={v.images?.[0] ? `${import.meta.env.VITE_UPLOAD_BASE_URL || "https://motoriq-lk.onrender.com"}${v.images[0]}` : "/no-image.png"}
                      className="w-12 h-10 object-cover rounded-lg" />
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{v.brand} {v.model} ({v.manufacturedYear})</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        LKR {v.price?.toLocaleString()} • {v.city} • {v.user?.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/vehicle/${v._id}`) }}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                      View
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteVehicle(v._id) }}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'var(--red-glow)', color: 'var(--red)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== TAB: FRAUD ===== */}
        {activeTab === "fraud" && (
          <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

            <h3 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: 'var(--red)' }}>
              🚨 Suspicious Listings ({flaggedVehicles.length})
            </h3>

            {flaggedVehicles.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">✅</div>
                <p style={{ color: 'var(--text-muted)' }}>No suspicious listings detected</p>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedVehicles.map(v => (
                  <div key={v._id} className="p-4 rounded-xl" style={{ background: 'var(--red-glow)', border: '1px solid var(--red)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{v.brand} {v.model} — LKR {v.price?.toLocaleString()}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Seller: {v.user?.name} ({v.user?.email})</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {v.reasons.map((r, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full font-medium text-white" style={{ background: 'var(--red)' }}>{r}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/vehicle/${v._id}`)}
                          className="text-xs px-3 py-1 rounded-lg" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                          View
                        </button>
                        <button onClick={() => deleteVehicle(v._id)}
                          className="text-xs px-3 py-1 rounded-lg text-white" style={{ background: 'var(--red)' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: BROADCAST NOTIFICATIONS ===== */}
        {activeTab === "notify" && (
          <div className="p-6 rounded-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

            <h3 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>📢 Send Broadcast Notification</h3>

            <div className="space-y-4 max-w-xl">

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Title</label>
                <input value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
                  className="input w-full" placeholder="e.g. Platform Update" />
              </div>

              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Message</label>
                <textarea value={broadcastText} onChange={e => setBroadcastText(e.target.value)}
                  className="input w-full h-24" placeholder="Type your message to users..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Type</label>
                  <select value={broadcastType} onChange={e => setBroadcastType(e.target.value)} className="input w-full">
                    <option value="system">🔔 System</option>
                    <option value="alert">⚠️ Alert</option>
                    <option value="price">💰 Price Update</option>
                    <option value="message">💬 Message</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Target Users</label>
                  <select value={broadcastTarget} onChange={e => setBroadcastTarget(e.target.value)} className="input w-full">
                    <option value="all">All Users ({users.length})</option>
                    <option value="sellers">Sellers Only ({users.filter(u => u.listingsCount > 0).length})</option>
                    <option value="banned">Banned Users ({users.filter(u => u.isBanned).length})</option>
                  </select>
                </div>
              </div>

              <button
                onClick={sendBroadcast}
                disabled={sendingBroadcast || !broadcastText.trim()}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', boxShadow: '0 4px 14px var(--primary-glow)' }}>
                {sendingBroadcast ? "Sending..." : "📢 Send Notification"}
              </button>

            </div>
          </div>
        )}

        {/* ===== TAB: BOOSTS ===== */}
        {activeTab === "boosts" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🌟 Pending Premium Boosts</h2>
            {pendingBoosts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No pending boost requests right now.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingBoosts.map(boost => (
                  <div key={boost._id} className="p-4 rounded-xl flex flex-col justify-between" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>
                    <div>
                      <h4 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{boost.brand} {boost.model}</h4>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}><b>Seller:</b> {boost.user?.name}</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}><b>Email:</b> {boost.user?.email}</p>
                      
                      <p className="text-sm font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>Deposited Slip:</p>
                      {boost.boostSlip ? (
                        <a href={`${import.meta.env.VITE_UPLOAD_BASE_URL || "https://motoriq-lk.onrender.com"}${boost.boostSlip}`} target="_blank" rel="noopener noreferrer">
                          <img src={`${import.meta.env.VITE_UPLOAD_BASE_URL || "https://motoriq-lk.onrender.com"}${boost.boostSlip}`} alt="Bank Slip" className="w-full h-40 object-cover rounded-lg border border-gray-300 dark:border-gray-600 mb-4 cursor-pointer hover:opacity-80 transition-opacity" />
                        </a>
                      ) : (
                        <p className="text-xs text-red-500 mb-4">No slip uploaded</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button onClick={() => handleBoostAction(boost._id, "approve")} className="flex-1 bg-green-500 text-white font-bold py-2.5 rounded-lg hover:bg-green-600 transition shadow-lg">Approve</button>
                      <button onClick={() => handleBoostAction(boost._id, "reject")} className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-lg hover:bg-red-600 transition shadow-lg">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}