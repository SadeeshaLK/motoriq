import { useEffect, useState } from "react"
import axios from "../api/axios"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import useAuth from "../hooks/useAuth"
import ChatWindow from "../components/ChatWindow"

export default function Inbox(){

  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  /* ===== FETCH CHATS ===== */

  const fetchChats = async () => {
    try {
      const res = await axios.get("/chat", {
        headers: { Authorization: token }
      })
      setChats(res.data)
    } catch (err) {
      console.error("Failed to load chats:", err)
    }
  }

  useEffect(() => {
    if (token) fetchChats()
  }, [token])

  /* ===== DELETE CHAT ===== */

  const handleDeleteChat = async (chatId) => {
    if (!window.confirm("Delete this entire conversation? This cannot be undone.")) return

    try {
      await axios.delete(`/chat/${chatId}`, {
        headers: { Authorization: token }
      })

      setChats(prev => prev.filter(c => c._id !== chatId))

      if (activeChat?._id === chatId) {
        setActiveChat(null)
      }
    } catch (err) {
      console.error("Failed to delete chat:", err)
      alert("Failed to delete conversation")
    }
  }

  /* ===== FILTER CHATS ===== */

  const filteredChats = chats.filter(chat => {
    if (!searchTerm.trim()) return true
    const otherUser = chat.users.find(u => u._id !== user.id)
    const vehicleName = `${chat.vehicle?.brand || ""} ${chat.vehicle?.model || ""}`
    const userName = otherUser?.name || ""
    const search = searchTerm.toLowerCase()
    return userName.toLowerCase().includes(search) || vehicleName.toLowerCase().includes(search)
  })

  /* ===== GET LAST MESSAGE ===== */

  const getLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) return "No messages yet"
    const last = chat.messages[chat.messages.length - 1]
    const text = last.text || ""
    return text.length > 35 ? text.slice(0, 35) + "..." : text
  }

  /* ===== GET UNREAD COUNT ===== */

  const getUnreadCount = (chat) => {
    if (!chat.messages || !user) return 0
    return chat.messages.filter(m => {
      const senderId = typeof m.sender === "object" ? m.sender._id : m.sender
      const isRead = m.readBy?.some(id => String(id) === String(user.id))
      return String(senderId) !== String(user.id) && !isRead
    }).length
  }

  /* ===== GET TIME ===== */

  const getLastTime = (chat) => {
    if (!chat.messages || chat.messages.length === 0) return ""
    const last = chat.messages[chat.messages.length - 1]
    const date = new Date(last.createdAt || chat.updatedAt)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return(

    <div className="min-h-screen" style={{ background: 'var(--bg-body)' }}>

      <Navbar/>

      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6 p-10">

        {/* ===== CHAT LIST SIDEBAR ===== */}

        <div className="rounded-xl backdrop-blur-md overflow-hidden flex flex-col"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)', maxHeight: 'calc(100vh - 140px)' }}>

          {/* Header */}
          <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                💬 Messages
              </h2>
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                {chats.length}
              </span>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          {/* Chat items */}
          <div className="flex-1 overflow-y-auto">

            {filteredChats.length === 0 && (
              <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {searchTerm ? "No conversations found" : "No messages yet"}
              </div>
            )}

            {filteredChats.map(chat => {

              const otherUser = chat.users.find(u => u._id !== user.id)
              const unread = getUnreadCount(chat)
              const isActive = activeChat?._id === chat._id

              return(

                <div
                  key={chat._id}
                  className="p-3 cursor-pointer transition-all relative group"
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent'
                  }}
                  onClick={() => setActiveChat(chat)}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-glass-hover)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >

                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* User name */}
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
                          {otherUser?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {otherUser?.name || "Unknown"}
                          </div>
                          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            {chat.vehicle?.brand} {chat.vehicle?.model}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Time + unread */}
                    <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {getLastTime(chat)}
                      </span>
                      {unread > 0 && (
                        <span className="text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                          style={{ background: 'var(--primary)' }}>
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Last message preview */}
                  <p className="text-xs mt-1 pl-10 truncate" style={{ color: unread > 0 ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: unread > 0 ? 600 : 400 }}>
                    {getLastMessage(chat)}
                  </p>

                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteChat(chat._id)
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--red-glow)', color: 'var(--red)' }}
                    title="Delete conversation"
                  >
                    🗑
                  </button>

                </div>

              )

            })}

          </div>

        </div>

        {/* ===== CHAT WINDOW ===== */}

        <div className="col-span-2">

          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              onDeleteChat={() => handleDeleteChat(activeChat._id)}
            />
          ) : (
            <div className="rounded-xl p-16 text-center backdrop-blur-md flex flex-col items-center gap-4"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)', minHeight: '500px', justifyContent: 'center' }}>

              <div className="text-5xl mb-2">💬</div>

              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                Your Messages
              </h3>

              <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
                Select a conversation from the list to start chatting, or browse vehicles to message sellers.
              </p>

              <button
                onClick={() => navigate("/")}
                className="mt-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:-translate-y-0.5 transition-all"
                style={{ boxShadow: '0 2px 8px var(--primary-glow)' }}
              >
                Browse Vehicles
              </button>

            </div>
          )}

        </div>

      </div>

    </div>

  )

}
