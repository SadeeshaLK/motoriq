import { Home, Car, Users, BarChart3, Star } from "lucide-react"
import { Link } from "react-router-dom"

export default function Sidebar() {
  return (
    <div className="w-64 h-screen fixed bg-gradient-to-b from-[#1f2a44] to-[#162036] text-white">

      <div className="p-6 text-2xl font-extrabold text-orange-400 tracking-wide">
        MOTORIQ
      </div>

      <nav className="mt-8 space-y-1">

        <Link to="/dashboard" className="flex items-center gap-3 px-6 py-3 bg-white/10">
          <Home size={18}/> Dashboard
        </Link>

        <Link to="/vehicles" className="flex items-center gap-3 px-6 py-3 hover:bg-white/10">
          <Car size={18}/> Vehicles
        </Link>

        <div className="flex items-center gap-3 px-6 py-3 hover:bg-white/10">
          <Users size={18}/> Users
        </div>

        <div className="flex items-center gap-3 px-6 py-3 hover:bg-white/10">
          <BarChart3 size={18}/> Analytics
        </div>

        <div className="flex items-center gap-3 px-6 py-3 hover:bg-white/10">
          <Star size={18}/> Premium Listings
        </div>

      </nav>
    </div>
  )
}