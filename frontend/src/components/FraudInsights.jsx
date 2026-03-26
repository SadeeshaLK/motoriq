import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function FraudInsights() {

  const [open, setOpen] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-8">

      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h3 className="font-semibold">
          AI-Powered Trust & Fraud Detection
        </h3>
        <ChevronDown className={`${open ? "rotate-180" : ""} transition`} />
      </div>

      {open && (
        <ul className="mt-4 space-y-3 text-sm text-gray-600">

          <li>• Estimated price is LKR 100,000 less than listed.</li>
          <li>• Detected title discrepancy.</li>
          <li>• Multiple listings by same seller recently.</li>
          <li>• Image similarity match found.</li>

        </ul>
      )}

    </div>
  )
}