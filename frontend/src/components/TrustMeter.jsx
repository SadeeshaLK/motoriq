import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js"

ChartJS.register(ArcElement, Tooltip)

export default function TrustMeter({ score }) {

  const data = {
    datasets: [
      {
        data: [score, 100 - score],
        backgroundColor: ["#f97316", "#e5e7eb"],
        borderWidth: 0,
      }
    ]
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 text-center">
      <h3 className="font-semibold mb-4">Trust & Fraud Detection</h3>

      <div className="w-40 mx-auto">
        <Doughnut data={data} />
      </div>

      <p className="mt-4 text-2xl font-bold text-orange-500">
        {score}
      </p>

      <p className="text-sm text-gray-500">
        {score < 50 ? "Low Trust Score" : "Good Trust Score"}
      </p>
    </div>
  )
}