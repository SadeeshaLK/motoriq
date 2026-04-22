import { useState, useEffect } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import VehicleCard from "../components/VehicleCard"
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"

export default function Account() {

  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("ads")
  const [myAds, setMyAds] = useState([])
  const [favorites, setFavorites] = useState([])

  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    phone: "",
    city: ""
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: ""
  })

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
          username: user?.username || "",
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
      alert("Failed to delete ad")
    }
  }

  const removeFavorite = async (id) => {
    try {
      await axios.post(`/users/favorite/${id}`, {}, {
        headers: { Authorization: token }
      })

      setFavorites(prev => prev.filter(v => v._id !== id))
    } catch (err) {
      alert("Failed to remove favorite")
    }
  }

  const updateProfile = async () => {
    await axios.put("/users/profile", profileData, {
      headers: { Authorization: token }
    })
    alert("Profile updated successfully")
  }

  const changePassword = async () => {
    await axios.put("/users/change-password", passwordData, {
      headers: { Authorization: token }
    })
    alert("Password changed successfully")
  }

  const menuItem = (key, label, icon) => (
    <li
      onClick={() => setActiveTab(key)}
      className={`cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg transition text-sm font-medium`}
      style={activeTab === key
        ? { background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', boxShadow: '0 2px 8px var(--primary-glow)' }
        : { color: 'var(--text-secondary)' }
      }
      onMouseEnter={e => { if (activeTab !== key) e.currentTarget.style.background = 'var(--bg-glass-hover)' }}
      onMouseLeave={e => { if (activeTab !== key) e.currentTarget.style.background = 'transparent' }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </li>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      <Navbar />

      <div className="p-10">

        <div className="max-w-6xl mx-auto rounded-xl grid grid-cols-4 overflow-hidden"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

          {/* SIDEBAR */}
          <div className="p-6" style={{ borderRight: '1px solid var(--border-subtle)' }}>

            <h2 className="font-bold text-lg mb-6" style={{ color: 'var(--text-primary)' }}>
              Welcome {user?.username}
            </h2>

            <ul className="space-y-2">

              {menuItem("ads", "My Ads", "🚗")}
              {menuItem("favorites", "Favorites", "❤️")}
              {menuItem("edit", "Edit Profile", "✏️")}
              {menuItem("password", "Change Password", "🔒")}

              <li
                onClick={() => {
                  logout()
                  navigate("/")
                }}
                className="cursor-pointer flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition"
                style={{ color: 'var(--red)' }}
              >
                🚪 Logout
              </li>

            </ul>

          </div>

          {/* CONTENT */}
          <div className="col-span-3 p-8">

            {/* MY ADS */}
            {activeTab === "ads" && (
              <>
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>My Ads</h3>

                {myAds.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    You currently have no vehicles posted.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {myAds.map(vehicle => (
                      <div key={vehicle._id} className="relative">

                        <VehicleCard
                          vehicle={vehicle}
                          compareList={[]}
                          setCompareList={() => {}}
                          monthlyBudget={50000}
                        />

                        <div className="flex gap-2 mt-3 px-2">

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/edit-vehicle/${vehicle._id}`)
                            }}
                            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium transition"
                            style={{ background: 'var(--blue-glow)', color: 'var(--blue)' }}
                          >
                            ✏️ Edit
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteAd(vehicle._id)
                            }}
                            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg font-medium transition"
                            style={{ background: 'var(--red-glow)', color: 'var(--red)' }}
                          >
                            🗑 Delete
                          </button>

                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* FAVORITES */}
            {activeTab === "favorites" && (
              <>
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Favorites</h3>

                {favorites.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    You have no favorite vehicles.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    {favorites.map(vehicle => (
                      <div key={vehicle._id} className="relative">

                        <VehicleCard
                          vehicle={vehicle}
                          compareList={[]}
                          setCompareList={() => {}}
                          monthlyBudget={50000}
                        />

                        <button
                          onClick={() => removeFavorite(vehicle._id)}
                          className="mt-2 text-sm px-2 font-medium transition"
                          style={{ color: 'var(--red)' }}>
                          Remove from Favorites
                        </button>

                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* EDIT PROFILE */}
            {activeTab === "edit" && (
              <>
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Edit Profile</h3>

                <div className="space-y-4 max-w-md">

                  <input type="text" value={profileData.username} className="input"
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })} />

                  <input type="email" value={profileData.email} className="input"
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />

                  <input type="text" placeholder="Phone Number" value={profileData.phone} className="input"
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} />

                  <input type="text" placeholder="City" value={profileData.city} className="input"
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })} />

                  <button onClick={updateProfile}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:-translate-y-0.5 transition-all duration-300"
                    style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}>
                    Save Changes
                  </button>

                </div>
              </>
            )}

            {/* CHANGE PASSWORD */}
            {activeTab === "password" && (
              <>
                <h3 className="text-xl font-semibold mb-6" style={{ color: 'var(--text-primary)' }}>Change Password</h3>

                <div className="space-y-4 max-w-md">

                  <input type="password" placeholder="Current Password" value={passwordData.currentPassword} className="input"
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} />

                  <input type="password" placeholder="New Password" value={passwordData.newPassword} className="input"
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />

                  <button onClick={changePassword}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:-translate-y-0.5 transition-all duration-300"
                    style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}>
                    Update Password
                  </button>

                </div>
              </>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}