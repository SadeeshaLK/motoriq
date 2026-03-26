import mongoose from "mongoose"

const reviewSchema = new mongoose.Schema({

  vehicle:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Vehicle"
  },

  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  },

  rating:{
    type:Number,
    min:1,
    max:5
  },

  comment:String

},{
  timestamps:true
})

export default mongoose.model("Review", reviewSchema)
