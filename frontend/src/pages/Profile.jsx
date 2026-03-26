import { useEffect, useState } from "react"
import axios from "../api/axios"
import useAuth from "../hooks/useAuth"

export default function Profile() {

  const { token } = useAuth()

  const [form, setForm] = useState({
    name: "",
    phone: "",
    bio: "",
    location: "",
    role: "buyer"
  })

  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await axios.get("/users/profile", {
        headers: { Authorization: token }
      })
      setForm(res.data)
    }
    fetchProfile()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const data = new FormData()

    Object.keys(form).forEach(key =>
      data.append(key, form[key])
    )

    if (image)
      data.append("profileImage", image)

    await axios.put("/users/profile", data, {
      headers: {
        Authorization: token,
        "Content-Type": "multipart/form-data"
      }
    })

    alert("Profile Updated")
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-16 flex justify-center">

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-10 w-full max-w-xl space-y-6"
      >
        <h2 className="text-2xl font-bold">Edit Profile</h2>

        <input
          placeholder="Full Name"
          className="input"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
        />

        <input
          placeholder="Phone"
          className="input"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
        />

        <input
          placeholder="Location"
          className="input"
          value={form.location}
          onChange={(e) =>
            setForm({ ...form, location: e.target.value })
          }
        />

        <textarea
          placeholder="Bio"
          className="input h-24"
          value={form.bio}
          onChange={(e) =>
            setForm({ ...form, bio: e.target.value })
          }
        />

        <select
          className="input"
          value={form.role}
          onChange={(e) =>
            setForm({ ...form, role: e.target.value })
          }
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>

        <input
          type="file"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <button
          disabled={loading}
          className="w-full bg-orange-500 text-white p-4 rounded-xl"
        >
          {loading ? "Saving..." : "Update Profile"}
        </button>

      </form>
    </div>
  )
}