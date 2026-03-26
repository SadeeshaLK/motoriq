import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import useAuth from "../hooks/useAuth"
import axios from "../api/axios"
import { socket } from "../socket"
import { toast } from "react-hot-toast"

export default function Navbar() {

  const { user, isAuthenticated, logout, token } = useAuth()

  const [open, setOpen] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [favoritesCount,setFavoritesCount] = useState(0)
  const [mobileOpen,setMobileOpen] = useState(false)
  const [search,setSearch] = useState("")

  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  /* LOAD NOTIFICATIONS */

  useEffect(() => {

    const loadNotifications = async () => {

      try {

        const res = await axios.get("/notifications",{
          headers:{ Authorization: token }
        })

        setNotifications(res.data)

      } catch(err){
        console.error("Notification load error:",err)
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

      toast("📩 New message received")

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


  return (

    <nav className="bg-white shadow-md border-b sticky top-0 z-50">

      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* LOGO */}

        <Link
          to="/"
          className="text-2xl font-bold text-orange-500 tracking-wide"
        >
          MotorIQ
        </Link>


        {/* SEARCH BAR */}

        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 mx-10 max-w-xl"
        >

          <input
            type="text"
            placeholder="Search cars, brands..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="w-full border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          <button
            className="bg-orange-500 text-white px-4 rounded-r-lg hover:bg-orange-600"
          >
            🔍
          </button>

        </form>


        {/* RIGHT SIDE */}

        <div className="flex items-center gap-5">

          {!isAuthenticated && (
            <>
              <button
                onClick={()=>navigate("/login")}
                className="text-gray-700 hover:text-orange-500"
              >
                Login
              </button>

              <button
                onClick={()=>navigate("/register")}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
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
                className="hidden md:block bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 font-semibold"
              >
                + Sell Car
              </button>


              {/* FAVORITES */}

              <button
                onClick={()=>navigate("/favorites")}
                className="relative text-xl"
              >
                ❤️

                {favoritesCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                    {favoritesCount}
                  </span>
                )}

              </button>


              {/* NOTIFICATIONS */}

              <div className="relative">

                <button
                  onClick={()=>setShowNotif(!showNotif)}
                  className="relative text-xl"
                >
                  🔔

                  {notifications.filter(n=>!n.read).length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                      {notifications.filter(n=>!n.read).length}
                    </span>
                  )}

                </button>

                {showNotif && (

                  <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-xl py-2 z-50 animate-fade-in">

                    {notifications.length === 0 && (
                      <p className="p-3 text-sm text-gray-500">
                        No notifications
                      </p>
                    )}

                    {notifications.map((n,i)=>(
                      <div
                        key={i}
                        className={`p-3 border-b text-sm cursor-pointer ${
                          n.read ? "" : "bg-gray-100"
                        }`}
                        onClick={()=>{
                          navigate(n.link || "/inbox")
                          setShowNotif(false)
                        }}
                      >
                        {n.text || "New notification"}
                      </div>
                    ))}

                  </div>

                )}

              </div>


              {/* PROFILE */}

              <div className="relative">

                <button
                  onClick={()=>setOpen(!open)}
                  className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition"
                >

                  <div className="w-8 h-8 bg-orange-500 text-white flex items-center justify-center rounded-full font-semibold">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>

                  <span className="hidden md:block font-medium">
                    {user?.username}
                  </span>

                </button>


                {open && (

                  <div className="absolute right-0 mt-3 w-60 bg-white shadow-xl rounded-xl py-2 z-50 animate-fade-in">

                    <div className="px-4 py-3 border-b">

                      <p className="font-semibold text-gray-800">
                        {user?.username}
                      </p>

                      <p className="text-xs text-gray-500">
                        {user?.email}
                      </p>

                    </div>


                    <button
                      onClick={()=>navigate("/account")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      My Account
                    </button>


                    <button
                      onClick={()=>navigate("/favorites")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Favorites
                    </button>


                    <button
                      onClick={()=>navigate("/inbox")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Messages
                    </button>


                    <button
                      onClick={()=>navigate("/settings")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Settings
                    </button>


                    {user?.email === "admin@motoriq.lk" && (
                      <button
                        onClick={()=>navigate("/admin")}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-orange-600 font-semibold"
                      >
                        Admin Dashboard
                      </button>
                    )}


                    <hr className="my-2" />


                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                    >
                      Logout
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