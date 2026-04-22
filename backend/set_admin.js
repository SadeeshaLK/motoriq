import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const setAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const email = "admin@motoriq.lk";
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`❌ User with email ${email} not found.`);
      process.exit(1);
    }

    user.isAdmin = true;
    // Also remove role if it exists to clean up
    user.role = undefined; 
    
    await user.save();

    console.log(`✅ User ${email} is now an admin (isAdmin: true).`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

setAdmin();
