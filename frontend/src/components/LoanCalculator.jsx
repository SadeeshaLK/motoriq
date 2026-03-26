import { useState } from "react"

export default function LoanCalculator({ price }) {

  const [years,setYears] = useState(5)
  const [interest,setInterest] = useState(10)

  const months = years * 12
  const monthlyInterest = interest / 100 / 12

  const emi =
    (price * monthlyInterest *
    Math.pow(1 + monthlyInterest, months)) /
    (Math.pow(1 + monthlyInterest, months) - 1)

  return (
    <div className="bg-white p-6 rounded-xl shadow">

      <h3 className="font-bold mb-3">Loan Calculator</h3>

      <div className="text-sm mb-2">
        Years: {years}
      </div>

      <input
        type="range"
        min="1"
        max="7"
        value={years}
        onChange={(e)=>setYears(e.target.value)}
        className="w-full"
      />

      <div className="text-sm mt-3">
        Interest: {interest}%
      </div>

      <input
        type="range"
        min="5"
        max="18"
        value={interest}
        onChange={(e)=>setInterest(e.target.value)}
        className="w-full"
      />

      <div className="mt-4 text-orange-600 font-bold">
        EMI: LKR {Math.round(emi)}
      </div>

    </div>
  )
}
