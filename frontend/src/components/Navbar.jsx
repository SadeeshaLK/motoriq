import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import axios from "../api/axios"
import { socket } from "../socket"
import { toast } from "react-hot-toast"
import { useTheme } from "../context/ThemeContext"

export default function Navbar() {

  const { user, isAuthenticated, logout, token } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [open, setOpen] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [favoritesCount,setFavoritesCount] = useState(0)
  const [mobileOpen,setMobileOpen] = useState(false)
  const [search,setSearch] = useState("")
  const [scrolled, setScrolled] = useState(false)

  const navigate = useNavigate()

  const isDark = theme === "dark"

  /* SCROLL EFFECT */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  /* LOAD NOTIFICATIONS */

  useEffect(() => {

    const loadNotifications = async () => {

      try {

        const res = await axios.get("/notifications", {
          headers: { Authorization: token }
        })

        // Handle both old format (array) and new format ({notifications, unreadCount})
        const data = res.data
        if (Array.isArray(data)) {
          setNotifications(data)
        } else {
          setNotifications(data.notifications || [])
        }

      } catch(err){
        console.error("Notification load error:", err)
      }

    }

    if(isAuthenticated){
      loadNotifications()
    }

  },[isAuthenticated,token])


  /* LOAD FAVORITES COUNT */

  useEffect(()=>{

    const loadFavorites = async ()=>{

      try{

        const res = await axios.get("/users/favorites",{
          headers:{ Authorization: token }
        })

        setFavoritesCount(res.data.length)

      }catch(err){
        console.log(err)
      }

    }

    if(isAuthenticated){
      loadFavorites()
    }

  },[isAuthenticated,token])


  /* SOCKET LISTENER */

  useEffect(()=>{

    const handleNewNotification = (notif)=>{

      setNotifications(prev=>[
        notif,
        ...prev
      ])

      toast(
        `${notif.type === 'message' ? '💬' : notif.type === 'alert' ? '⚠️' : '🔔'} ${notif.title || notif.text}`,
        { duration: 4000 }
      )

    }

    socket.on("newNotification",handleNewNotification)

    return ()=>socket.off("newNotification",handleNewNotification)

  },[])

  useEffect(()=>{

    if(user?.id){
      socket.emit("joinUser", user.id)
    }

  },[user])


  /* SEARCH */

  const handleSearch = (e)=>{

    e.preventDefault()

    if(!search.trim()) return

    navigate(`/search?q=${search}`)

  }

  const unreadCount = notifications.filter(n=>!n.read).length

  return (

    <nav
      className="sticky top-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? `var(--nav-bg)` : 'transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        borderBottom: scrolled ? `1px solid var(--nav-border)` : 'none',
        boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
      }}
    >

      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* LOGO */}

        <Link
          to="/"
          className="flex items-center group"
        >
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Motor<span style={{ color: 'var(--primary)' }}>IQ</span>
          </span>
        </Link>


        {/* SEARCH BAR */}

        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 mx-10 max-w-xl"
        >

          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 transition-colors" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cars, brands..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="input !pl-11 !rounded-xl"
            />
          </div>

        </form>


        {/* RIGHT SIDE */}

        <div className="flex items-center gap-3">

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <div className="theme-toggle-knob">
              {isDark ? "🌙" : "☀️"}
            </div>
          </button>

          {!isAuthenticated && (
            <>
              <button
                onClick={()=>navigate("/login")}
                className="text-sm font-medium transition-colors duration-200 px-3 py-2 rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >
                Login
              </button>

              <button
                onClick={()=>navigate("/register")}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:-translate-y-0.5 transition-all duration-300"
                style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}
              >
                Register
              </button>
            </>
          )}


          {isAuthenticated && (
            <>

              {/* SELL CAR */}

              <button
                onClick={()=>navigate("/add-vehicle")}
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:-translate-y-0.5 transition-all duration-300"
                style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Sell Car
              </button>


              {/* FAVORITES */}

              <button
                onClick={()=>navigate("/favorites")}
                className="relative p-2 rounded-lg transition-all duration-200"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.target.style.background = 'var(--bg-glass-hover)'}
                onMouseLeave={e => e.target.style.background = 'transparent'}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>

                {favoritesCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full"
                    style={{ boxShadow: '0 2px 8px var(--red-glow)' }}>
                    {favoritesCount}
                  </span>
                )}

              </button>


              {/* NOTIFICATIONS */}

              <div className="relative">

                <button
                  onClick={()=>setShowNotif(!showNotif)}
                  className="relative p-2 rounded-lg transition-all duration-200"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>

                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full animate-pulse"
                      style={{ background: 'var(--primary)', boxShadow: '0 2px 8px var(--primary-glow)' }}>
                      {unreadCount}
                    </span>
                  )}

                </button>

                {showNotif && (

                  <div className="absolute right-0 mt-3 w-80 backdrop-blur-xl border rounded-xl py-2 z-50 animate-fade-in"
                    style={{ background: 'var(--dropdown-bg)', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

                    {/* Header */}
                    <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</p>
                      <div className="flex gap-2">
                        {notifications.filter(n=>!n.read).length > 0 && (
                          <button
                            onClick={async () => {
                              await axios.put("/notifications/read-all", {}, { headers: { Authorization: token } })
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })))
                            }}
                            className="text-xs font-medium"
                            style={{ color: 'var(--primary)' }}
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={async () => {
                              await axios.delete("/notifications", { headers: { Authorization: token } })
                              setNotifications([])
                            }}
                            className="text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>

                    {notifications.length === 0 && (
                      <div className="p-8 text-center">
                        <div className="text-3xl mb-2">🔔</div>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                      </div>
                    )}

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n,i)=>(
                        <div
                          key={n._id || i}
                          className="px-4 py-3 text-sm cursor-pointer transition-colors flex items-start gap-3 group relative"
                          style={{
                            background: n.read ? 'transparent' : 'var(--primary-glow)',
                            borderLeft: n.read ? '3px solid transparent' : '3px solid var(--primary)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                          onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'var(--primary-glow)'}
                          onClick={async () => {
                            if (!n.read && n._id) {
                              await axios.put(`/notifications/read/${n._id}`, {}, { headers: { Authorization: token } })
                              setNotifications(prev => prev.map(item => item._id === n._id ? { ...item, read: true } : item))
                            }
                            navigate(n.link || "/inbox")
                            setShowNotif(false)
                          }}
                        >
                          {/* Type icon */}
                          <span className="text-base flex-shrink-0 mt-0.5">
                            { n.type === 'message' ? '💬'
                            : n.type === 'alert' ? '⚠️'
                            : n.type === 'banned' ? '🚫'
                            : n.type === 'price' ? '💰'
                            : n.type === 'favorite' ? '❤️'
                            : '🔔' }
                          </span>

                          <div className="flex-1 min-w-0">
                            {n.title && (
                              <p className="font-semibold text-xs mb-0.5" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                            )}
                            <p className="truncate" style={{ color: n.read ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                              {n.text || "New notification"}
                            </p>
                            {n.createdAt && (
                              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>

                          {/* Delete button */}
                          {n._id && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                await axios.delete(`/notifications/${n._id}`, { headers: { Authorization: token } })
                                setNotifications(prev => prev.filter(item => item._id !== n._id))
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs p-1 rounded flex-shrink-0"
                              style={{ color: 'var(--text-muted)' }}
                            >
                              ✕
                            </button>
                          )}

                        </div>
                      ))}
                    </div>

                  </div>

                )}

              </div>


              {/* PROFILE */}

              <div className="relative">

                <button
                  onClick={()=>setOpen(!open)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all duration-300"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}
                >

                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 text-white flex items-center justify-center rounded-lg font-semibold text-sm"
                    style={{ boxShadow: '0 2px 8px var(--primary-glow)' }}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>

                  <span className="hidden md:block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {user?.username}
                  </span>

                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>

                </button>


                {open && (

                  <div className="absolute right-0 mt-3 w-64 backdrop-blur-xl border rounded-xl py-2 z-50 animate-fade-in"
                    style={{ background: 'var(--dropdown-bg)', borderColor: 'var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>

                      <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {user?.username}
                      </p>

                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {user?.email}
                      </p>

                    </div>

                    {[
                      { key: "account",   icon: "👤", label: "My Account",  path: "/account" },
                      { key: "favorites", icon: "❤️", label: "Favorites",   path: "/favorites" },
                      { key: "inbox",     icon: "💬", label: "Messages",    path: "/inbox" },
                      { key: "settings",  icon: "⚙️", label: "Settings",    path: "/settings" },
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={()=>{ navigate(item.path); setOpen(false) }}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--dropdown-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                      >
                        <span className="text-base">{item.icon}</span> {item.label}
                      </button>
                    ))}


                    {user?.email === "admin@motoriq.lk" && (
                      <button
                        onClick={()=>{ navigate("/admin"); setOpen(false) }}
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors"
                        style={{ color: 'var(--primary)' }}
                      >
                        <span className="text-base">🛡</span> Admin Dashboard
                      </button>
                    )}


                    <hr style={{ borderColor: 'var(--border-subtle)', margin: '8px 0' }} />


                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--red)' }}
                    >
                      <span className="text-base">🚪</span> Logout
                    </button>

                  </div>

                )}

              </div>

            </>
          )}

        </div>

      </div>

    </nav>

  )

}