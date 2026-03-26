import { useEffect, useState } from "react"

export default function AnimatedTrustGauge({ score }) {

  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let start = 0
    const interval = setInterval(() => {
      start += 1
      setDisplayScore(start)
      if (start >= score) clearInterval(interval)
    }, 15)
  }, [score])

  const getColor = () => {
    if (score >= 70) return "stroke-green-500 text-green-500"
    if (score >= 40) return "stroke-orange-500 text-orange-500"
    return "stroke-red-500 text-red-500"
  }

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white rounded-xl shadow-md p-6 text-center">

      <h3 className="font-semibold mb-6">
        Trust & Fraud Detection
      </h3>

      <div className="relative w-40 h-40 mx-auto">

        <svg width="160" height="160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="12"
            fill="none"
          />

          <circle
            cx="80"
            cy="80"
            r={radius}
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={getColor()}
            style={{
              transition: "stroke-dashoffset 1s ease"
            }}
          />
        </svg>

        <div className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${getColor()}`}>
          {displayScore}
        </div>

      </div>

      <p className="mt-4 text-sm text-gray-500">
        {score >= 70
          ? "High Trust Score"
          : score >= 40
          ? "Moderate Trust"
          : "Low Trust Score"}
      </p>

    </div>
  )
}