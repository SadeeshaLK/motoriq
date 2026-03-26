import { useState } from "react"
import axios from "../api/axios"
import { useNavigate } from "react-router-dom"

export default function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()

    try {
      const res = await axios.post("/auth/login", {
        email,
        password
      })

      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))

      navigate("/")

    } catch (err) {
      setError("Invalid email or password")
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">

        <h2 className="text-3xl font-bold text-center text-orange-500 mb-8">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-5 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">

          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition duration-200"
          >
            Login
          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-orange-500 cursor-pointer hover:underline"
          >
            Register here
          </span>
        </p>

      </div>

    </div>
  )
}