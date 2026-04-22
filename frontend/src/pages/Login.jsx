import { useState } from "react"
import axios from "../api/axios"
import { useNavigate } from "react-router-dom"

export default function Login() {

  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

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

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)` }}
    >

      {/* Background effects */}
      <div className="absolute w-[500px] h-[500px] rounded-full top-[-150px] right-[-100px]" style={{ background: 'var(--primary)', opacity: 0.07, filter: 'blur(120px)' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full bottom-[-100px] left-[-100px]" style={{ background: 'var(--blue)', opacity: 0.05, filter: 'blur(100px)' }} />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Motor<span style={{ color: 'var(--primary)' }}>IQ</span>
          </span>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl rounded-2xl p-8"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Sign in to your account to continue
          </p>

          {error && (
            <div className="p-3 rounded-xl mb-6 text-sm text-center"
              style={{ background: 'var(--red-glow)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input
                type="email"
                placeholder="you@email.com"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
              style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>

          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="cursor-pointer font-medium transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Create one
            </span>
          </p>

        </div>

      </div>

    </div>
  )
}