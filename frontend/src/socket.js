import { io } from "socket.io-client"

const URL = import.meta.env.VITE_UPLOAD_BASE_URL || "https://motoriq-lk.onrender.com"
export const socket = io(URL, {
})