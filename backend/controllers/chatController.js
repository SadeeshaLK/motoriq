import Chat from "../models/Chat.js"
import Notification from "../models/Notification.js"

/* CREATE OR GET CHAT */

export const getChat = async(req,res)=>{
  try {
    const {vehicleId,sellerId}=req.params

    let chat = await Chat.findOne({
      vehicle: vehicleId,
      users: { $all: [req.user._id, sellerId] }
    })

    if (!chat) {
      chat = await Chat.create({
        vehicle: vehicleId,
        users: [req.user._id, sellerId],
        messages: []
      })
    }

    res.json(chat)
  } catch (err) {
    console.error("getChat error:", err)
    res.status(500).json({ message: "Failed to get or create chat", error: err.message })
  }
}


/* SEND MESSAGE */

export const sendMessage = async (req, res) => {

  const { chatId } = req.params
  const { text } = req.body

  const chat = await Chat.findById(chatId)

  const message = {
  sender:req.user.id,
  text,
  createdAt:new Date(),
  readBy:[req.user.id] // sender already read
}

chat.messages.push(message)

await chat.save()

const receiver = chat.users.find(
  u => String(u) !== String(req.user.id)
)

const notification = await Notification.create({
  user: receiver,
  text: "📩 New message received",
  link: "/inbox"
})

req.io.to(receiver.toString()).emit("newNotification", notification)

res.json({
  message,
  messages:chat.messages
})

}

export const getUserChats = async (req, res) => {

  try {

    const chats = await Chat.find({
      users: { $in: [req.user.id] }
    })
    .populate("users", "name")
    .populate("vehicle", "brand model images")
    .sort({ updatedAt: -1 })

    res.json(chats)

  } catch (error) {

    console.error(error)
    res.status(500).json({ message: "Failed to fetch chats" })

  }

}

export const markAsRead = async (req,res)=>{

  try{

    const { chatId,messageId } = req.params

    const chat = await Chat.findById(chatId)

    if(!chat) return res.status(404).json({message:"Chat not found"})

    const message = chat.messages.id(messageId)

    if(!message) return res.status(404).json({message:"Message not found"})

    if(!message.readBy) message.readBy = []

    if(!message.readBy.includes(req.user.id)){
      message.readBy.push(req.user.id)
    }

    await chat.save()

    global.io.to(chatId).emit("messageRead",{
      messageId,
      userId:req.user.id
    })

    res.json({success:true})

  }
  catch(err){

    console.error(err)
    res.status(500).json({message:"Failed to mark read"})

  }

}

export const markAllRead = async (req,res)=>{

  try{

    const { chatId } = req.params
    const userId = req.user.id

    const chat = await Chat.findById(chatId)

    if(!chat) return res.status(404).json({message:"Chat not found"})

    chat.messages.forEach(m=>{

      const senderId =
        typeof m.sender === "object"
          ? m.sender._id
          : m.sender

      if(String(senderId) !== String(userId)){

        if(!m.readBy.includes(userId)){
          m.readBy.push(userId)
        }

      }

    })

    await chat.save()

    global.io.to(chatId).emit("messagesRead",{
      userId
    })

    res.json({success:true})

  }
  catch(err){
    console.error(err)
    res.status(500).json({message:"Failed"})
  }

}
