import { useState, useEffect } from "react"

export default function useAuth() {

  const [user, setUser] = useState(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = (data) => {
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
  }

  return {
    user,
    token: localStorage.getItem("token"),
    isAuthenticated: !!user,
    login,
    logout
  }
}