import axios from "axios"

const instance = axios.create({
  baseURL: "https://motoriq-lk.onrender.com/api"
})

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  }
)

export default instance