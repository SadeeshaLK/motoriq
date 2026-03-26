import mongoose from "mongoose"

const chatSchema = new mongoose.Schema({

  vehicle:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Vehicle"
  },

  users:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref:"User"
    }
  ],

  messages:[
{
  sender:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  text:String,
  createdAt:{
    type:Date,
    default:Date.now
  },
  readBy:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"User"
    }
  ]
}
]

},{
  timestamps:true
})

export default mongoose.model("Chat",chatSchema)
