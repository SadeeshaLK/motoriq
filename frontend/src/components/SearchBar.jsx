import { useState } from "react"

export default function SearchBar({ onSearch }) {

  const [filters, setFilters] = useState({
    brand: "",
    location: "",
    maxPrice: ""
  })

  return (
    <div className="bg-[#1f2a44] text-white py-8 px-12 shadow-lg">

      <div className="flex gap-4 items-center">

        <input
          placeholder="Search Brand..."
          className="p-3 rounded text-black w-52"
          onChange={(e) =>
            setFilters({ ...filters, brand: e.target.value })
          }
        />

        <input
          placeholder="Location"
          className="p-3 rounded text-black w-52"
          onChange={(e) =>
            setFilters({ ...filters, location: e.target.value })
          }
        />

        <input
          placeholder="Max Price"
          type="number"
          className="p-3 rounded text-black w-52"
          onChange={(e) =>
            setFilters({ ...filters, maxPrice: e.target.value })
          }
        />

        <button
          onClick={() => onSearch(filters)}
          className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700 transition"
        >
          SEARCH
        </button>

      </div>

    </div>
  )
}