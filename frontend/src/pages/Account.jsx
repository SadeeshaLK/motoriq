import { useState, useEffect } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import VehicleCard from "../components/VehicleCard"
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"

export default function Account() {

  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("ads")
  const [myAds, setMyAds] = useState([])
  const [favorites, setFavorites] = useState([])

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    city: ""
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: ""
  })

  const [showBoostModal, setShowBoostModal] = useState(null)
  const [boostImage, setBoostImage] = useState(null)
  const [isBoosting, setIsBoosting] = useState(false)

  useEffect(() => {
    if (!token) return

    const fetchData = async () => {
      try {
        const adsRes = await axios.get("/vehicles/my", {
          headers: { Authorization: token }
        })
        setMyAds(adsRes.data)

        const favRes = await axios.get("/users/favorites", {
          headers: { Authorization: token }
        })
        setFavorites(favRes.data)

        setProfileData({
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || "",
          city: user?.city || ""
        })

      } catch (err) {
        console.log(err)
      }
    }

    fetchData()
  }, [token, user])

  const deleteAd = async (id) => {
    if (!window.confirm("Are you sure you want to delete this ad?")) return

    try {
      await axios.delete(`/vehicles/${id}`, {
        headers: { Authorization: token }
      })

      setMyAds(prev => prev.filter(ad => ad._id !== id))
    } catch (err) {
      toast.error("Failed to delete ad")
    }
  }

  const removeFavorite = async (id) => {
    try {
      await axios.post(`/users/favorite/${id}`, {}, {
        headers: { Authorization: token }
      })

      setFavorites(prev => prev.filter(v => v._id !== id))
    } catch (err) {
      toast.error("Failed to remove favorite")
    }
  }

  const handleBoostSubmit = async () => {
    if(!boostImage) return toast.error("Please select a bank slip image")
    
    setIsBoosting(true)
    const formData = new FormData()
    formData.append("slipImage", boostImage)

    try {
      await axios.post(`/vehicles/${showBoostModal}/boost`, formData, {
         headers: { Authorization: token, "Content-Type": "multipart/form-data" }
      })
      toast.success("Boost request submitted! Awaiting admin approval.")
      setShowBoostModal(null)
      // refresh ads
      const adsRes = await axios.get("/vehicles/my", { headers: { Authorization: token } })
      setMyAds(adsRes.data)
    } catch(err) {
      toast.error("Failed to submit boost")
    } finally {
      setIsBoosting(false)
    }
  }

  const updateProfile = async () => {
    try {
      await axios.put("/users/profile", {
        name: profileData.name,
        phone: profileData.phone,
        city: profileData.city
      }, {
        headers: { Authorization: token }
      })
      toast.success("Profile updated successfully")
    } catch (err) {
      toast.error("Failed to update profile")
    }
  }

  const changePassword = async () => {
    try {
      await axios.put("/users/change-password", passwordData, {
        headers: { Authorization: token }
      })
      toast.success("Password changed successfully")
      setPasswordData({ currentPassword: "", newPassword: "" })
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password")
    }
  }

  const menuItem = (key, label, icon) => {
    const isActive = activeTab === key
    return (
      <button
        onClick={() => setActiveTab(key)}
        className="w-full relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden"
        style={{
          color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
          fontWeight: isActive ? 600 : 500,
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-glass-hover)' }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
      >
        {isActive && (
          <motion.div
            layoutId="activeTabBadge"
            className="absolute inset-0 z-0 rounded-xl"
            style={{ background: 'var(--primary-glow)', border: '1px solid rgba(249,115,22,0.1)' }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 text-lg">{icon}</span>
        <span className="relative z-10">{label}</span>
      </button>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      <Navbar />

      {/* Hero Header Area */}
      <div className="relative pt-10 pb-20 overflow-hidden" style={{ background: `linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 40%, var(--hero-to) 100%)` }}>
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-100px] left-[-100px]" style={{ background: 'var(--primary)', opacity: 0.05, filter: 'blur(100px)' }} />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-6"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl overflow-hidden"
              style={{ boxShadow: '0 8px 32px var(--primary-glow)' }}>
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{user?.name || "Your Account"}</h1>
              <p className="font-medium" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 pb-20 relative z-20">

        <div className="grid md:grid-cols-4 gap-8">

          {/* SIDEBAR */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="col-span-1 rounded-2xl p-4 h-fit backdrop-blur-xl border flex flex-col gap-2"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}
          >
            {menuItem("ads", "My Ads", "🚗")}
            {menuItem("favorites", "Favorites", "❤️")}
            {menuItem("edit", "Edit Profile", "✏️")}
            {menuItem("password", "Security", "🔒")}

            <hr style={{ borderColor: 'var(--border-subtle)', margin: '16px 0' }} />

            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to log out?")) {
                  logout()
                  navigate("/")
                }
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition"
              style={{ color: 'var(--red)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--red-glow)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span className="text-lg">🚪</span> Logout
            </button>
          </motion.div>

          {/* CONTENT AREA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="col-span-3 rounded-2xl p-8 backdrop-blur-xl border min-h-[500px]"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}
          >
            <AnimatePresence mode="wait">

              {/* MY ADS */}
              {activeTab === "ads" && (
                <motion.div
                  key="ads"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Listed Vehicles</h3>
                      <p className="mt-1 font-medium" style={{ color: 'var(--text-muted)' }}>Manage your vehicle advertisements.</p>
                    </div>
                    <button onClick={() => navigate("/add-vehicle")} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:-translate-y-0.5 transition-all shadow-lg text-sm">
                      + Post New Ad
                    </button>
                  </div>

                  {myAds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 rounded-2xl" style={{ border: '2px dashed var(--border-glass)', background: 'var(--bg-glass)' }}>
                      <span className="text-6xl mb-4 opacity-50">🚙</span>
                      <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Vehicles Listed</h4>
                      <p className="text-center max-w-sm mb-6 font-medium" style={{ color: 'var(--text-muted)' }}>You haven't posted any vehicles for sale yet. Start selling today!</p>
                      <button onClick={() => navigate("/add-vehicle")} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:-translate-y-0.5 transition-all">
                        Post an Ad
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myAds.map(vehicle => (
                        <div key={vehicle._id} className="relative group perspective" style={{ zIndex: 1 }}>
                          <VehicleCard
                            vehicle={vehicle}
                            compareList={[]}
                            setCompareList={() => {}}
                            monthlyBudget={50000}
                          />

                          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ zIndex: 10 }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/edit-vehicle/${vehicle._id}`) }}
                              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg"
                              style={{ background: 'rgba(59, 130, 246, 0.9)' }}
                              title="Edit Ad"
                            >
                              <span className="text-white text-lg drop-shadow-md">✏️</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteAd(vehicle._id) }}
                              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg"
                              style={{ background: 'rgba(239, 68, 68, 0.9)' }}
                              title="Delete Ad"
                            >
                              <span className="text-white text-lg drop-shadow-md">🗑</span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowBoostModal(vehicle._id) }}
                              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg"
                              style={{ background: 'rgba(234, 179, 8, 0.9)' }}
                              title="Boost Ad"
                            >
                              <span className="text-white text-lg drop-shadow-md">🚀</span>
                            </button>
                          </div>
                          
                          {/* BOOST STATUS BADGE */}
                          {vehicle.boostStatus && vehicle.boostStatus !== "none" && !vehicle.isPremium && (
                            <div className="absolute top-3 left-3 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md z-20"
                              style={{ background: vehicle.boostStatus === "rejected" ? 'var(--red)' : 'var(--blue)' }}>
                              Boost: {vehicle.boostStatus.toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}


              {/* FAVORITES */}
              {activeTab === "favorites" && (
                <motion.div
                  key="favorites"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Saved Vehicles</h3>
                  <p className="mb-8 font-medium" style={{ color: 'var(--text-muted)' }}>Vehicles you are keeping an eye on.</p>

                  {favorites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 rounded-2xl" style={{ border: '2px dashed var(--border-glass)', background: 'var(--bg-glass)' }}>
                      <span className="text-6xl mb-4 opacity-50">❤️</span>
                      <h4 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Favorites Yet</h4>
                      <p className="text-center max-w-sm mb-6 font-medium" style={{ color: 'var(--text-muted)' }}>Browse our marketplace and tap the heart icon to save vehicles you love.</p>
                      <button onClick={() => navigate("/")} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:-translate-y-0.5 transition-all">
                        Browse Vehicles
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favorites.map(vehicle => (
                        <div key={vehicle._id} className="relative group">
                          <VehicleCard
                            vehicle={vehicle}
                            compareList={[]}
                            setCompareList={() => {}}
                            monthlyBudget={50000}
                          />
                          <button
                            onClick={() => removeFavorite(vehicle._id)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: 'var(--red)', boxShadow: '0 4px 12px var(--shadow-md)' }}
                            title="Remove Favorite"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}


              {/* EDIT PROFILE */}
              {activeTab === "edit" && (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
                  <p className="mb-8 font-medium" style={{ color: 'var(--text-muted)' }}>Update your public profile details and contact info.</p>

                  <div className="space-y-5 max-w-xl">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="relative">
                        <input id="name" type="text" className="input peer" placeholder=" " value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                        <label htmlFor="name" className="floating-label">Full Name</label>
                      </div>
                      <div className="relative">
                        <input id="email" type="email" className="input peer" placeholder=" " value={profileData.email} disabled />
                        <label htmlFor="email" className="floating-label">Email (Immutable)</label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                      <div className="relative">
                        <input id="phone" type="text" className="input peer" placeholder=" " value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} />
                        <label htmlFor="phone" className="floating-label">Phone Number</label>
                      </div>
                      <div className="relative">
                        <input id="city" type="text" className="input peer" placeholder=" " value={profileData.city} onChange={(e) => setProfileData({ ...profileData, city: e.target.value })} />
                        <label htmlFor="city" className="floating-label">City / Location</label>
                      </div>
                    </div>

                    <button onClick={updateProfile} className="mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3.5 rounded-xl font-bold hover:-translate-y-0.5 transition-all duration-300 w-full md:w-auto mt-6" style={{ boxShadow: '0 8px 24px var(--primary-glow)' }}>
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              )}


              {/* CHANGE PASSWORD */}
              {activeTab === "password" && (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Account Security</h3>
                  <p className="mb-8 font-medium" style={{ color: 'var(--text-muted)' }}>Ensure your account stays secure by updating your password occasionally.</p>

                  <div className="space-y-6 max-w-sm">
                    <div className="relative">
                      <input id="currentPw" type="password" className="input peer" placeholder=" " value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />
                      <label htmlFor="currentPw" className="floating-label">Current Password</label>
                    </div>

                    <div className="relative">
                      <input id="newPw" type="password" className="input peer" placeholder=" " value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                      <label htmlFor="newPw" className="floating-label">New Password</label>
                    </div>

                    <button onClick={changePassword} className="bg-gradient-to-r from-zinc-800 to-black dark:from-zinc-100 dark:to-white dark:text-black text-white px-8 py-3.5 rounded-xl font-bold hover:-translate-y-0.5 transition-all duration-300 w-full" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                      Update Password
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

        </div>
      </div>

      {/* BOOST MODAL */}
      <AnimatePresence>
        {showBoostModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBoostModal(null)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md p-6 rounded-2xl shadow-2xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
              
              <button onClick={() => setShowBoostModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 hover:text-black dark:hover:text-white transition-colors">✕</button>

              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                🌟 Premium Boost
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Rank your ad at the top of the homepage and search results! A one-time administrative fee applies.
              </p>

              <div className="p-4 rounded-xl mb-6" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--primary)' }}>Payment Details</p>
                <div className="text-sm space-y-1" style={{ color: 'var(--text-secondary)' }}>
                  <p><b>Amount:</b> LKR 1000 /=</p>
                  <p><b>Bank:</b> Commercial Bank</p>
                  <p><b>Account Name:</b> MotorIQ PVT LTD</p>
                  <p><b>Account No:</b> 1234567890</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Upload Bank Transfer Slip</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setBoostImage(e.target.files[0])}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 dark:file:bg-orange-900/30 dark:file:text-orange-400"
                  style={{ color: 'var(--text-secondary)' }}
                />
              </div>

              <button 
                onClick={handleBoostSubmit} 
                disabled={isBoosting}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-50"
              >
                {isBoosting ? "Submitting..." : "Submit for Approval"}
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}