import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import { socket } from "../socket"
import EmojiPicker from "emoji-picker-react"

export default function ChatWindow({ chat, onDeleteChat }) {

  const { token, user } = useAuth()
  const navigate = useNavigate()

  const [messages, setMessages] = useState(
    Array.isArray(chat?.messages) ? chat.messages : []
  )

  const [text, setText] = useState("")
  const [typingUser, setTypingUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showEmoji, setShowEmoji] = useState(false)
  const [online, setOnline] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [contextMsg, setContextMsg] = useState(null)

  const bottomRef = useRef()
  const menuRef = useRef()

  const otherUser = chat?.users?.find(u => u._id !== user?.id)

  /* ================= JOIN CHAT ================= */

  useEffect(() => {
    if (chat?.messages) {
      const safeMessages = Array.isArray(chat.messages) ? chat.messages : []
      setMessages(safeMessages)
      socket.emit("joinChat", chat._id)
    }
  }, [chat])


  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])


  /* ================= MARK ALL READ ================= */

  useEffect(() => {
    if (!chat || !user || messages.length === 0) return
    axios.put(`/chat/read-all/${chat._id}`, {}, {
      headers: { Authorization: token }
    }).catch(() => {})
  }, [chat])


  /* ================= UNREAD BADGE ================= */

  useEffect(() => {
    if (!user) return
    const unread = messages.filter(m => {
      const senderId = typeof m.sender === "object" ? m.sender._id : m.sender
      const read = m.readBy?.some(id => String(id) === String(user.id))
      return String(senderId) !== String(user.id) && !read
    }).length
    setUnreadCount(unread)
  }, [messages, user])


  /* ================= SOCKET LISTENERS ================= */

  useEffect(() => {

    const handleReceive = (msg) => {
      if (!msg || !msg.text) return
      setMessages(prev => [...prev, msg])
    }

    const handleTyping = (data) => {
      if (!data || data.userId === user?.id) return
      setTypingUser(data.name)
      setTimeout(() => setTypingUser(null), 2000)
    }

    const handleRead = (data) => {
      setMessages(prev =>
        prev.map(m => ({
          ...m,
          readBy: [...(m.readBy || []), data.userId]
        }))
      )
    }

    const handleOnline = (status) => setOnline(status)

    const handleMessageDeleted = ({ messageId }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId))
    }

    socket.on("receiveMessage", handleReceive)
    socket.on("typing", handleTyping)
    socket.on("messagesRead", handleRead)
    socket.on("onlineStatus", handleOnline)
    socket.on("messageDeleted", handleMessageDeleted)

    return () => {
      socket.off("receiveMessage", handleReceive)
      socket.off("typing", handleTyping)
      socket.off("messagesRead", handleRead)
      socket.off("onlineStatus", handleOnline)
      socket.off("messageDeleted", handleMessageDeleted)
    }

  }, [user])


  /* ================= CLOSE MENU ON CLICK OUTSIDE ================= */

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
      setContextMsg(null)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])


  /* ================= SEND MESSAGE ================= */

  const sendMessage = async () => {
    if (!text.trim()) return

    try {
      const res = await axios.post(
        `/chat/${chat._id}`,
        { text },
        { headers: { Authorization: token } }
      )

      const newMessage = res.data?.message
      if (!newMessage) return

      socket.emit("sendMessage", {
        chatId: chat._id,
        message: newMessage
      })

      setText("")
      setShowEmoji(false)
    } catch (err) {
      console.error("Send failed:", err)
    }
  }


  /* ================= DELETE MESSAGE ================= */

  const deleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return

    try {
      await axios.delete(`/chat/${chat._id}/message/${messageId}`, {
        headers: { Authorization: token }
      })
      setMessages(prev => prev.filter(m => m._id !== messageId))
      setContextMsg(null)
    } catch (err) {
      console.error("Delete message error:", err)
      alert("Failed to delete message")
    }
  }


  /* ================= COPY MESSAGE ================= */

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text)
    setContextMsg(null)
  }


  /* ================= TYPING ================= */

  const handleTyping = (value) => {
    setText(value)
    socket.emit("typing", {
      chatId: chat._id,
      userId: user?.id,
      name: user?.name
    })
  }


  /* ================= EMOJI ================= */

  const addEmoji = (emoji) => {
    setText(prev => prev + emoji.emoji)
  }


  if (!chat || !user) return null


  return(

    <div className="rounded-xl flex flex-col h-[600px] backdrop-blur-md overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-md)' }}>

      {/* ===== CHAT HEADER ===== */}

      <div className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}>

        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))' }}>
            {otherUser?.name?.[0]?.toUpperCase() || "?"}
          </div>

          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {otherUser?.name || "Unknown"}
            </div>
            <div className="flex items-center gap-2">
              {online && (
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--green)' }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: 'var(--green)' }}></span>
                  Online
                </span>
              )}
              {chat.vehicle && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {chat.vehicle.brand} {chat.vehicle.model}
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2 relative" ref={menuRef}>

          {unreadCount > 0 && (
            <span className="text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--red)' }}>
              {unreadCount}
            </span>
          )}

          {/* View Ad button */}
          {chat.vehicle && (
            <button
              onClick={() => navigate(`/vehicle/${chat.vehicle._id}`)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}
              title="View vehicle listing"
            >
              🚗 View Ad
            </button>
          )}

          {/* Menu toggle */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all"
            style={{ background: showMenu ? 'var(--bg-glass-hover)' : 'transparent', color: 'var(--text-secondary)' }}
          >
            ⋮
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute top-10 right-0 w-44 rounded-xl py-1 z-50 backdrop-blur-xl"
              style={{ background: 'var(--dropdown-bg)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

              {chat.vehicle && (
                <button
                  onClick={() => { navigate(`/vehicle/${chat.vehicle._id}`); setShowMenu(false) }}
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  🚗 View Listing
                </button>
              )}

              <button
                onClick={() => { navigate(`/seller/${otherUser?._id}`); setShowMenu(false) }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                👤 View Profile
              </button>

              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

              <button
                onClick={() => { setShowMenu(false); onDeleteChat?.() }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                style={{ color: 'var(--red)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--red-glow)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                🗑 Delete Chat
              </button>

            </div>
          )}

        </div>

      </div>


      {/* ===== MESSAGES ===== */}

      <div className="flex-1 overflow-y-auto p-4" style={{ background: 'var(--bg-glass)' }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="text-3xl">👋</span>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}

        {messages
        .filter(m => m && m.text)
        .map((m, i) => {

          const senderId = typeof m.sender === "object" ? m.sender._id : m.sender
          const mine = String(senderId) === String(user.id)
          const seen = m.readBy?.some(id => String(id) !== String(user.id))

          const time = new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })

          const isContextOpen = contextMsg === m._id

          return(

            <div
              key={m._id || i}
              className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
            >

              <div className="relative group max-w-xs">

                {/* Message bubble */}
                <div
                  className="px-4 py-2 rounded-2xl cursor-pointer"
                  style={mine
                    ? { background: 'var(--primary)', color: 'white', boxShadow: '0 2px 8px var(--primary-glow)' }
                    : { background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }
                  }
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setContextMsg(isContextOpen ? null : m._id)
                  }}
                >

                  {m.text}

                  <div className="text-xs opacity-70 mt-1 flex justify-between gap-3">
                    <span>{time}</span>
                    {mine && (
                      <span>{seen ? "✔✔" : "✔"}</span>
                    )}
                  </div>

                </div>

                {/* Context menu on right-click */}
                {isContextOpen && (
                  <div
                    className={`absolute z-50 top-full mt-1 rounded-lg py-1 w-32 backdrop-blur-xl ${mine ? "right-0" : "left-0"}`}
                    style={{ background: 'var(--dropdown-bg)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}
                  >
                    <button
                      onClick={() => copyMessage(m.text)}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--dropdown-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      📋 Copy
                    </button>
                    {mine && (
                      <button
                        onClick={() => deleteMessage(m._id)}
                        className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 transition-colors"
                        style={{ color: 'var(--red)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--red-glow)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        🗑 Delete
                      </button>
                    )}
                  </div>
                )}

              </div>

            </div>

          )

        })}

        {typingUser && (
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="animate-pulse">•••</span>
            {typingUser} is typing...
          </div>
        )}

        <div ref={bottomRef}></div>

      </div>


      {/* ===== INPUT ===== */}

      <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>

        {showEmoji && (
          <div className="mb-2">
            <EmojiPicker onEmojiClick={addEmoji} theme="auto" />
          </div>
        )}

        <div className="flex gap-2 items-center">

          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className="text-xl px-2 rounded-lg transition-all"
            style={{ background: showEmoji ? 'var(--bg-glass-hover)' : 'transparent' }}
          >
            😊
          </button>

          <input
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            className="input flex-1"
            placeholder="Type a message..."
          />

          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
            style={{ boxShadow: text.trim() ? '0 2px 8px var(--primary-glow)' : 'none' }}
          >
            Send
          </button>

        </div>

      </div>

    </div>

  )

}