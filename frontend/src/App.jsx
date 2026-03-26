import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import AddVehicle from "./pages/AddVehicle"
import Profile from "./pages/Profile"
import SellerDashboard from "./pages/SellerDashboard"
import Favorites from "./pages/Favorites"
import Account from "./pages/Account"
import AdminDashboard from "./pages/AdminDashboard"
import VehicleDetails from "./pages/VehicleDetails"
import Inbox from "./pages/Inbox"
import EditVehicle from "./pages/EditVehicle"
import Search from "./pages/Search"
import Compare from "./pages/Compare"
import SellerProfile from "./pages/SellerProfile"


function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token")
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <><Routes>

      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/account" element={<Account />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/seller-dashboard" element={<SellerDashboard />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/vehicle/:id" element={<VehicleDetails />} />
      <Route path="/inbox" element={<Inbox />} />
      <Route path="/edit-vehicle/:id" element={<EditVehicle />} />
      <Route path="/search" element={<Search />} />
      <Route path="/compare" element={<Compare />} />
      <Route path="/seller/:id" element={<SellerProfile />} />
      


      <Route
        path="/dashboard"
        element={<ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>} />

      <Route
        path="/add-vehicle"
        element={<ProtectedRoute>
          <AddVehicle />
        </ProtectedRoute>} />

    </Routes>
    <Toaster position="top-right" /></>
  )
}