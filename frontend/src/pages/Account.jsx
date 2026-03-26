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

  // 🔥 UPDATED STATE
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

        // 🔥 UPDATED PROFILE LOAD
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
      className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg transition 
        ${activeTab === key
          ? "bg-orange-500 text-white"
          : "text-gray-700 hover:bg-gray-100 hover:text-orange-500"}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </li>
  )

  return (
    <div className="min-h-screen bg-gray-100">

      <Navbar />

      <div className="p-10">

        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg grid grid-cols-4">

          {/* SIDEBAR */}
          <div className="border-r p-6">

            <h2 className="font-bold text-lg mb-6">
              Welcome {user?.username}
            </h2>

            <ul className="space-y-3 font-medium">

              {menuItem("ads", "My Ads", "🚗")}
              {menuItem("favorites", "Favorites", "❤️")}
              {menuItem("edit", "Edit Profile", "✏️")}
              {menuItem("password", "Change Password", "🔒")}

              <li
                onClick={() => {
                  logout()
                  navigate("/")
                }}
                className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-red-500 hover:bg-red-50"
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
                <h3 className="text-xl font-semibold mb-6">My Ads</h3>

                {myAds.length === 0 ? (
                  <p className="text-gray-500">
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
                            className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteAd(vehicle._id)
                            }}
                            className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition"
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
                <h3 className="text-xl font-semibold mb-6">Favorites</h3>

                {favorites.length === 0 ? (
                  <p className="text-gray-500">
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
                          className="mt-2 text-sm text-red-600 hover:underline px-2">
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
                <h3 className="text-xl font-semibold mb-6">Edit Profile</h3>

                <div className="space-y-4 max-w-md">

                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) =>
                      setProfileData({ ...profileData, username: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  />

                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  />

                  {/* 🔥 NEW FIELD */}
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, phone: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  />

                  {/* 🔥 NEW FIELD */}
                  <input
                    type="text"
                    placeholder="City"
                    value={profileData.city}
                    onChange={(e) =>
                      setProfileData({ ...profileData, city: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  />

                  <button
                    onClick={updateProfile}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition">
                    Save Changes
                  </button>

                </div>
              </>
            )}

            {/* CHANGE PASSWORD */}
            {activeTab === "password" && (
              <>
                <h3 className="text-xl font-semibold mb-6">Change Password</h3>

                <div className="space-y-4 max-w-md">

                  <input
                    type="password"
                    placeholder="Current Password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  />

                  <input
                    type="password"
                    placeholder="New Password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg"
                  />

                  <button
                    onClick={changePassword}
                    className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition">
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