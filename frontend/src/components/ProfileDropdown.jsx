import { useState } from "react"
import { useNavigate } from "react-router-dom"

export default function ProfileDropdown({ user }) {

  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const logout = () => {
    localStorage.clear()
    navigate("/")
  }

  return (
    <div className="relative">

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2">
        <div className="bg-orange-500 w-8 h-8 rounded-full flex items-center justify-center">
          {user.name[0]}
        </div>
        {user.name}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white text-black rounded shadow-md w-40">

          <button
            className="block w-full px-4 py-2 hover:bg-gray-100 text-left"
            onClick={() => navigate("/profile")}
          >
            View Profile
          </button>

          <button
            className="block w-full px-4 py-2 hover:bg-gray-100 text-left"
            onClick={logout}
          >
            Logout
          </button>

        </div>
      )}

    </div>
  )
}