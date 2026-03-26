import { useEffect, useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import { socket } from "../socket"

export default function VehicleChat({ vehicle }) {

  const { token, user } = useAuth()

  const [chat, setChat] = useState(null)
  const [message, setMessage] = useState("")

  /* ---------------- LOAD CHAT ---------------- */

  useEffect(() => {

    const loadChat = async () => {

      try {

        const res = await axios.get(
          `/chat/${vehicle._id}/${vehicle.user._id}`,
          { headers: { Authorization: token } }
        )

        setChat(res.data)

        socket.emit("joinChat", res.data._id)

      } catch (err) {
        console.error("Chat load error:", err)
      }

    }

    if (vehicle && token) {
      loadChat()
    }

  }, [vehicle, token])


  /* ---------------- RECEIVE MESSAGE ---------------- */

  useEffect(() => {

    const handleReceiveMessage = (msg) => {

      setChat(prev => {

        if (!prev) return prev

        return {
          ...prev,
          messages: [...prev.messages, msg]
        }

      })

    }

    socket.on("receiveMessage", handleReceiveMessage)

    return () => {
      socket.off("receiveMessage", handleReceiveMessage)
    }

  }, [])


  /* ---------------- SEND MESSAGE ---------------- */

  const sendMessage = async () => {

    if (!message.trim()) return

    try {

      await axios.post(
        `/chat/${chat._id}`,
        { text: message },
        { headers: { Authorization: token } }
      )

      socket.emit("sendMessage", {
        chatId: chat._id,
        message: {
          sender: user.id,
          text: message
        }
      })

      setMessage("")

    } catch (err) {
      console.error("Send message error:", err)
    }

  }


  /* ---------------- QUICK MESSAGE ---------------- */

  const sendQuickMessage = async () => {

    const quickMessage = "Hi! Is this still available?"

    try {

      await axios.post(
        `/chat/${chat._id}`,
        { text: quickMessage },
        { headers: { Authorization: token } }
      )

      socket.emit("sendMessage", {
        chatId: chat._id,
        message: {
          sender: user.id,
          text: quickMessage
        }
      })

    } catch (err) {
      console.error("Quick message error:", err)
    }

  }


  if (!chat) return null


  return (
    <div className="mt-6 bg-white p-4 rounded shadow">

      <h3 className="font-semibold mb-3">
        Chat with Seller
      </h3>

      <div className="h-48 overflow-y-auto border p-3 mb-3">

        {chat.messages.map((m, i) => {

          const senderId =
            m?.sender && typeof m.sender === "object"
            ? m.sender._id
            : m?.sender

          const mine = String(senderId) === String(user.id)

          return (
            <div
              key={i}
              className={`mb-2 ${mine ? "text-right" : ""}`}
            >
              <span
                className={`inline-block px-3 py-2 rounded ${
                  mine
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {m.text}
              </span>
            </div>
          )

        })}

      </div>


      {/* QUICK MESSAGE BUTTON */}

      <div className="mb-3">
        <button
          onClick={sendQuickMessage}
          className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full"
        >
          Hi! Is this still available?
        </button>
      </div>


      <div className="flex gap-2">

        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Type a message..."
        />

        <button
          onClick={sendMessage}
          className="bg-orange-500 text-white px-4 rounded"
        >
          Send
        </button>

      </div>

    </div>
  )
}