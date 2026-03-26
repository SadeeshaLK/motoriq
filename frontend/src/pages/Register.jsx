import { useState } from "react"
import axios from "../api/axios"
import { useNavigate } from "react-router-dom"
import { sriLanka } from "../data/sriLankaLocations"

export default function Register() {

  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    province: "",
    district: "",
    city: ""
  })

  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpArray, setOtpArray] = useState(["","","","","",""])
  const [timer, setTimer] = useState(0)

  const [emailExists, setEmailExists] = useState(false)
  const [phoneValid, setPhoneValid] = useState(true)

  /* ---------------- HANDLE CHANGE ---------------- */

  const handleChange = async (e) => {

    const { name, value } = e.target

    setForm({ ...form, [name]: value })

    /* EMAIL CHECK */
    if (name === "email" && value.includes("@")) {
      try {
        const res = await axios.get(`/auth/check-email?email=${value}`)
        setEmailExists(res.data.exists)
      } catch (error) {
        console.error("Error checking email:", error)
      }
    }

    /* PHONE VALIDATION */
    if (name === "phone") {
      const regex = /^(?:\+94|0)?7\d{8}$/
      setPhoneValid(regex.test(value))
    }

  }

  /* ---------------- EMAIL OTP ---------------- */

  const sendOtp = async () => {

  if (!form.email) return alert("Enter email first")

  if (timer > 0) return

  try {

    await axios.post("/auth/send-otp", {
      email: form.email
    })

    setOtpSent(true)
    setTimer(30)

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    alert("OTP sent 📧")

  } catch (err) {
    alert(err.response?.data?.message || "Failed")
  }

}

  const verifyOtp = async () => {

  const otp = otpArray.join("")

  try {

    const res = await axios.post("/auth/verify-otp", {
      email: form.email,
      otp
    })

    if (res.data.success) {
      setOtpVerified(true)
      alert("Verified ✅")
    } else {
      alert(res.data.message || "Invalid OTP")
    }

  } catch {
    alert("Verification failed")
  }

}

  /* ---------------- REGISTER ---------------- */

  const handleRegister = async () => {

    if (form.password !== form.confirmPassword) {
      return alert("Passwords do not match ❌")
    }

    if (emailExists) {
      return alert("Email already exists")
    }

    if (!otpVerified) {
      return alert("Verify email first 📧")
    }

    try {

      await axios.post("/auth/register", form)

      alert("Registration successful 🎉")
      navigate("/login")

    } catch {
      alert("Registration failed")
    }

  }

  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <div className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-md">

        <h2 className="text-3xl font-bold text-center text-orange-500 mb-8">
          Create Account
        </h2>

        <div className="space-y-5">

          {/* NAME */}
          <div className="relative">
            <input name="name" onChange={handleChange} className="input peer" placeholder=" " />
            <label className="floating-label">Full Name</label>
          </div>

          {/* EMAIL + OTP */}
          <div className="relative">
            <input name="email" onChange={handleChange} className="input peer" placeholder=" " />
            <label className="floating-label">Email</label>

            {emailExists && <p className="text-red-500 text-xs">Email already exists</p>}

            <button
              onClick={sendOtp}
              className="mt-2 text-sm text-orange-500"
            >
              Send OTP
            </button>
          </div>

          {otpSent && !otpVerified && (

  <div className="flex flex-col items-center gap-4">

    <div className="flex gap-2">

      {otpArray.map((digit, index) => (

        <input
          key={index}
          type="text"
          maxLength="1"
          value={digit}
          onChange={(e)=>{

            const value = e.target.value

            if (!/^\d?$/.test(value)) return

            const newOtp = [...otpArray]
            newOtp[index] = value
            setOtpArray(newOtp)

            if (value && index < 5) {
              document.getElementById(`otp-${index+1}`).focus()
            }

          }}
          onKeyDown={(e)=>{
            if (e.key === "Backspace" && !otpArray[index] && index > 0) {
              document.getElementById(`otp-${index-1}`).focus()
            }
          }}
          id={`otp-${index}`}
          className="w-10 h-12 text-center border rounded-lg text-lg focus:ring-2 focus:ring-orange-400"
        />

      ))}

    </div>

    <button
      onClick={verifyOtp}
      className="bg-green-500 text-white px-4 py-2 rounded"
    >
      Verify OTP
    </button>

    <button
      onClick={sendOtp}
      disabled={timer > 0}
      className="text-sm text-gray-500"
    >
      {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
    </button>

  </div>

)}

          {otpVerified && <p className="text-green-600 text-sm">Email Verified ✅</p>}

          {/* PHONE */}
          <input
            name="phone"
            onChange={handleChange}
            className="input"
            placeholder="Phone Number"
          />

          {!phoneValid && <p className="text-red-500 text-xs">Invalid phone</p>}

          {/* PASSWORD */}
          <div className="relative">
            <input type="password" name="password" onChange={handleChange} className="input peer" placeholder=" " />
            <label className="floating-label">Password</label>
          </div>

          <div className="relative">
            <input type="password" name="confirmPassword" onChange={handleChange} className="input peer" placeholder=" " />
            <label className="floating-label">Confirm Password</label>
          </div>

          {/* LOCATION */}
          <div className="grid grid-cols-3 gap-2">

            <select className="input" value={form.province}
              onChange={(e)=>setForm({...form,province:e.target.value,district:"",city:""})}>
              <option value="">Province</option>
              {Object.keys(sriLanka).map(p=><option key={p}>{p}</option>)}
            </select>

            <select className="input" value={form.district}
              onChange={(e)=>setForm({...form,district:e.target.value,city:""})}
              disabled={!form.province}>
              <option value="">District</option>
              {form.province && Object.keys(sriLanka[form.province]).map(d=><option key={d}>{d}</option>)}
            </select>

            <select className="input" value={form.city}
              onChange={(e)=>setForm({...form,city:e.target.value})}
              disabled={!form.district}>
              <option value="">City</option>
              {form.district && sriLanka[form.province][form.district].map(c=><option key={c}>{c}</option>)}
            </select>

          </div>

          <button onClick={handleRegister} className="btn-orange w-full">
            Register
          </button>

        </div>

      </div>

    </div>
  )
}