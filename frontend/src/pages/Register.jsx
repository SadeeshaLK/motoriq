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

    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, var(--hero-from) 0%, var(--hero-via) 50%, var(--hero-to) 100%)` }}
    >

      {/* Background effects */}
      <div className="absolute w-[500px] h-[500px] rounded-full top-[-150px] left-[-100px]" style={{ background: 'var(--primary)', opacity: 0.07, filter: 'blur(120px)' }} />
      <div className="absolute w-[400px] h-[400px] rounded-full bottom-[-100px] right-[-100px]" style={{ background: 'var(--blue)', opacity: 0.05, filter: 'blur(100px)' }} />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <span className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Motor<span style={{ color: 'var(--primary)' }}>IQ</span>
          </span>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl rounded-2xl p-8"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-lg)' }}>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Create Account
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Join the smartest vehicle marketplace
          </p>

          <div className="space-y-4">

            {/* NAME */}
            <div className="relative">
              <input name="name" onChange={handleChange} className="input peer" placeholder=" " />
              <label className="floating-label">Full Name</label>
            </div>

            {/* EMAIL + OTP */}
            <div className="relative">
              <input name="email" onChange={handleChange} className="input peer" placeholder=" " />
              <label className="floating-label">Email</label>

              {emailExists && <p style={{ color: 'var(--red)' }} className="text-xs mt-1">Email already exists</p>}

              <button onClick={sendOtp} className="mt-2 text-sm font-medium" style={{ color: 'var(--primary)' }}>
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
          className="w-10 h-12 text-center rounded-lg text-lg"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-input)', color: 'var(--text-primary)' }}
        />

      ))}

    </div>

    <button onClick={verifyOtp} className="text-white px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: 'var(--green)' }}>
      Verify OTP
    </button>

    <button onClick={sendOtp} disabled={timer > 0} className="text-sm" style={{ color: 'var(--text-muted)' }}>
      {timer > 0 ? `Resend in ${timer}s` : "Resend OTP"}
    </button>

  </div>

)}

            {otpVerified && <p className="text-sm" style={{ color: 'var(--green)' }}>Email Verified ✅</p>}

            {/* PHONE */}
            <input name="phone" onChange={handleChange} className="input" placeholder="Phone Number" />
            {!phoneValid && <p className="text-xs" style={{ color: 'var(--red)' }}>Invalid phone</p>}

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

            <button onClick={handleRegister}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:-translate-y-0.5 transition-all duration-300"
              style={{ boxShadow: '0 4px 14px var(--primary-glow)' }}>
              Register
            </button>

            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{" "}
              <span onClick={() => navigate("/login")} className="cursor-pointer font-medium" style={{ color: 'var(--primary)' }}>Sign In</span>
            </p>

          </div>

        </div>

      </div>

    </div>
  )
}