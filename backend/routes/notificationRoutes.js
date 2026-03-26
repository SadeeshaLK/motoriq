import express from "express"
import Notification from "../models/Notification.js"
import auth from "../middleware/authMiddleware.js"

const router = express.Router()

/* GET USER NOTIFICATIONS */

router.get("/",auth,async(req,res)=>{

  try{

    const notifications = await Notification.find({
      user:req.user.id
    })
    .sort({createdAt:-1})
    .limit(20)

    res.json(notifications)

  }catch(err){
    res.status(500).json({message:"Server error"})
  }

})

/* MARK AS READ */

router.put("/read/:id",auth,async(req,res)=>{

  try{

    await Notification.findByIdAndUpdate(
      req.params.id,
      {read:true}
    )

    res.json({success:true})

  }catch(err){
    res.status(500).json({message:"Server error"})
  }

})

export default router