import { useEffect, useState } from "react"
import axios from "../api/axios"
import Navbar from "../components/Navbar"
import useAuth from "../hooks/useAuth"
import ChatWindow from "../components/ChatWindow"

export default function Inbox(){

  const { token, user } = useAuth()

  const [chats,setChats] = useState([])
  const [activeChat,setActiveChat] = useState(null)

  useEffect(()=>{

    const fetchChats = async()=>{
    //console.log("TOKEN:", token)

      const res = await axios.get(
        "/chat",
        { headers:{Authorization:token} }
      )

      setChats(res.data)

    }

    if(token) fetchChats()

  },[])

  return(

    <div className="bg-gray-100 min-h-screen">

      <Navbar/>

      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6 p-10">

        {/* CHAT LIST */}

        <div className="bg-white rounded-xl shadow p-4">

          <h2 className="font-semibold mb-4">
            Messages
          </h2>

          {chats.map(chat=>{

            const otherUser =
                chat.users.find(u => u._id !== user.id)


            return(

              <div
                key={chat._id}
                onClick={()=>setActiveChat(chat)}
                className="p-3 border-b cursor-pointer hover:bg-gray-50"
              >

                <div className="font-medium">
                  {otherUser?.name}
                </div>

                <div className="text-sm text-gray-500">
                  {chat.vehicle?.brand} {chat.vehicle?.model}
                </div>

              </div>

            )

          })}

        </div>

        {/* CHAT WINDOW */}

        <div className="col-span-2">

          {activeChat ? (
            <ChatWindow chat={activeChat}/>
          ) : (
            <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
              Select a conversation
            </div>
          )}

        </div>

      </div>

    </div>

  )

}
