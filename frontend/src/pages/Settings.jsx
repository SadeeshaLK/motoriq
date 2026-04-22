import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { motion } from "framer-motion"
import { useTheme } from "../context/ThemeContext"
import useAuth from "../hooks/useAuth"
import axios from "../api/axios"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const isDark = theme === "dark"

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: true
  })

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showPhone: false
  })

  // Fetch true state from backend
  useEffect(() => {
    if (!token) return
    const fetchSettings = async () => {
      try {
        const res = await axios.get("/users/profile", { headers: { Authorization: token } })
        if (res.data.settings) {
          if (res.data.settings.notifications) setNotifications(res.data.settings.notifications)
          if (res.data.settings.privacy) setPrivacy(res.data.settings.privacy)
        }
      } catch (err) {
        console.error("Failed to load settings")
      }
    }
    fetchSettings()
  }, [token])

  // Save to backend automatically
  const handleToggle = async (section, key, value) => {
    // 1. Update local state
    if (section === "notifications") {
      setNotifications(prev => ({ ...prev, [key]: value }))
    } else {
      setPrivacy(prev => ({ ...prev, [key]: value }))
    }
    
    // 2. Sync to backend
    try {
      const payload = {
        settings: {
          notifications: section === "notifications" ? { ...notifications, [key]: value } : notifications,
          privacy: section === "privacy" ? { ...privacy, [key]: value } : privacy
        }
      }
      await axios.put("/users/profile", payload, { headers: { Authorization: token } })
      toast.success("Settings updated")
    } catch (err) {
      toast.error("Failed to save setting")
    }
  }

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you completely sure? This will delete all your data and vehicles instantly.")) {
      try {
        await axios.delete("/users/account", { headers: { Authorization: token } })
        toast.success("Account deleted permanently")
        logout()
        navigate("/")
      } catch (err) {
        toast.error("Failed to delete account")
      }
    }
  }

  const Switch = ({ checked, onChange }) => (
    <div
      onClick={onChange}
      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${checked ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <motion.div
        className="w-4 h-4 bg-white rounded-full shadow-md"
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        style={{ x: checked ? 24 : 0 }}
      />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Settings</h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Manage your app preferences and privacy controls.</p>
        </motion.div>

        <div className="space-y-8">

          {/* APPEARANCE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl backdrop-blur-xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>🎨</span> Appearance
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Dark Mode</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Toggle between light and dark theme.</p>
              </div>
              <Switch checked={isDark} onChange={toggleTheme} />
            </div>
          </motion.div>


          {/* NOTIFICATIONS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl backdrop-blur-xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>🔔</span> Notifications
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Email Notifications</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receive updates about messages and favorites via email.</p>
                </div>
                <Switch checked={notifications.email} onChange={() => handleToggle("notifications", "email", !notifications.email)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Push Notifications</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Allow real-time browser push notifications.</p>
                </div>
                <Switch checked={notifications.push} onChange={() => handleToggle("notifications", "push", !notifications.push)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Marketing & Promos</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Receive occasional promotional emails.</p>
                </div>
                <Switch checked={notifications.marketing} onChange={() => handleToggle("notifications", "marketing", !notifications.marketing)} />
              </div>
            </div>
          </motion.div>


          {/* PRIVACY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl backdrop-blur-xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-sm)' }}
          >
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>🛡</span> Privacy & Security
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Public Profile</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Allow others to see your seller profile.</p>
                </div>
                <Switch checked={privacy.publicProfile} onChange={() => handleToggle("privacy", "publicProfile", !privacy.publicProfile)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Show Phone Number</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Display your contact number on your car listings.</p>
                </div>
                <Switch checked={privacy.showPhone} onChange={() => handleToggle("privacy", "showPhone", !privacy.showPhone)} />
              </div>
            </div>
          </motion.div>

          {/* DANGER ZONE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl border"
            style={{ background: 'transparent', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--red)' }}>
              Danger Zone
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Permanently delete your account and all associated data, including vehicles listed. This action cannot be undone.
            </p>
            <button onClick={handleDeleteAccount} className="px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 font-semibold transition" style={{ background: 'var(--red-glow)', color: 'var(--red)' }}>
              <span>🗑</span> Delete Account
            </button>
          </motion.div>

        </div>

      </div>
    </div>
  )
}
