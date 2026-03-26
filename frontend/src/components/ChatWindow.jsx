import { useState, useEffect, useRef } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"
import { socket } from "../socket"
import EmojiPicker from "emoji-picker-react"

export default function ChatWindow({ chat }) {

  const { token, user } = useAuth()

  const [messages,setMessages] = useState(
    Array.isArray(chat?.messages) ? chat.messages : []
  )

  const [text,setText] = useState("")
  const [typingUser,setTypingUser] = useState(null)
  const [unreadCount,setUnreadCount] = useState(0)
  const [showEmoji,setShowEmoji] = useState(false)
  const [online,setOnline] = useState(false)

  const bottomRef = useRef()

  /* ================= JOIN CHAT ================= */

  useEffect(()=>{

    if(chat?.messages){

      const safeMessages =
        Array.isArray(chat.messages) ? chat.messages : []

      setMessages(safeMessages)

      socket.emit("joinChat",chat._id)

    }

  },[chat])


  /* ================= AUTO SCROLL ================= */

  useEffect(()=>{

    bottomRef.current?.scrollIntoView({
      behavior:"smooth"
    })

  },[messages])


  /* ================= MARK ALL READ (OPTIMIZED) ================= */

  useEffect(()=>{

    if(!chat || !user || messages.length === 0) return

    axios.put(
      `/chat/read-all/${chat._id}`,
      {},
      { headers:{ Authorization:token } }
    ).catch(()=>{})

  },[chat])


  /* ================= UNREAD BADGE ================= */

  useEffect(()=>{

    if(!user) return

    const unread = messages.filter(m=>{

      const senderId =
        typeof m.sender === "object"
          ? m.sender._id
          : m.sender

      const read =
        m.readBy?.some(id => String(id) === String(user.id))

      return String(senderId) !== String(user.id) && !read

    }).length

    setUnreadCount(unread)

  },[messages,user])


  /* ================= SOCKET LISTENERS ================= */

  useEffect(()=>{

    const handleReceive = (msg)=>{

      if(!msg || !msg.text) return

      setMessages(prev=>[...prev,msg])

    }

    const handleTyping = (data)=>{

      if(!data || data.userId === user?.id) return

      setTypingUser(data.name)

      setTimeout(()=>{
        setTypingUser(null)
      },2000)

    }

    const handleRead = (data)=>{

      setMessages(prev =>
        prev.map(m=>{
          return {
            ...m,
            readBy:[...(m.readBy || []),data.userId]
          }
        })
      )

    }

    const handleOnline = (status)=>{
      setOnline(status)
    }

    socket.on("receiveMessage",handleReceive)
    socket.on("typing",handleTyping)
    socket.on("messagesRead",handleRead)
    socket.on("onlineStatus",handleOnline)

    return ()=>{

      socket.off("receiveMessage",handleReceive)
      socket.off("typing",handleTyping)
      socket.off("messagesRead",handleRead)
      socket.off("onlineStatus",handleOnline)

    }

  },[user])


  /* ================= SEND MESSAGE ================= */

  const sendMessage = async()=>{

    if(!text.trim()) return

    const res = await axios.post(
      `/chat/${chat._id}`,
      {text},
      {headers:{Authorization:token}}
    )

    const newMessage = res.data?.message

    if(!newMessage) return

    socket.emit("sendMessage",{
      chatId:chat._id,
      message:newMessage
    })

    setText("")

  }


  /* ================= TYPING ================= */

  const handleTyping = (value)=>{

    setText(value)

    socket.emit("typing",{
      chatId:chat._id,
      userId:user?.id,
      name:user?.name
    })

  }


  /* ================= EMOJI ================= */

  const addEmoji = (emoji)=>{

    setText(prev => prev + emoji.emoji)

  }


  if(!chat || !user) return null


  return(

    <div className="bg-white rounded-xl shadow flex flex-col h-[600px]">

      {/* ===== CHAT HEADER ===== */}

      <div className="border-b p-4 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <div className="font-semibold">
            Chat
          </div>

          {online && (
            <span className="text-green-500 text-sm">
              ● Online
            </span>
          )}

        </div>

        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        )}

      </div>


      {/* ===== MESSAGES ===== */}

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">

        {messages
        .filter(m=>m && m.text)
        .map((m,i)=>{

          const senderId =
            typeof m.sender === "object"
              ? m.sender._id
              : m.sender

          const mine =
            String(senderId) === String(user.id)

          const seen =
            m.readBy?.some(
              id => String(id) !== String(user.id)
            )

          const time = new Date(
            m.createdAt || Date.now()
          ).toLocaleTimeString([],{
            hour:"2-digit",
            minute:"2-digit"
          })

          return(

            <div
              key={i}
              className={`mb-3 flex ${mine ? "justify-end":"justify-start"}`}
            >

              <div
                className={`px-4 py-2 rounded-2xl max-w-xs shadow ${
                  mine
                  ? "bg-blue-500 text-white"
                  : "bg-white"
                }`}
              >

                {m.text}

                <div className="text-xs opacity-70 mt-1 flex justify-between">

                  <span>{time}</span>

                  {mine && (

                    <span>

                      {seen
                        ? "✔✔ Seen"
                        : "✔ Delivered"
                      }

                    </span>

                  )}

                </div>

              </div>

            </div>

          )

        })}

        {typingUser && (

          <div className="text-sm text-gray-500">
            {typingUser} is typing...
          </div>

        )}

        <div ref={bottomRef}></div>

      </div>


      {/* ===== INPUT ===== */}

      <div className="border-t p-3">

        {showEmoji && (
          <div className="mb-2">
            <EmojiPicker onEmojiClick={addEmoji}/>
          </div>
        )}

        <div className="flex gap-2">

          <button
            onClick={()=>setShowEmoji(!showEmoji)}
            className="text-xl"
          >
            😊
          </button>

          <input
            value={text}
            onChange={(e)=>handleTyping(e.target.value)}
            onKeyDown={(e)=>{
              if(e.key==="Enter"){
                sendMessage()
              }
            }}
            className="flex-1 border p-2 rounded-lg"
            placeholder="Type a message..."
          />

          <button
            onClick={sendMessage}
            className="bg-orange-500 text-white px-4 rounded-lg"
          >
            Send
          </button>

        </div>

      </div>

    </div>

  )

}