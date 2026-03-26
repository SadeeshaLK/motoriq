import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
} from "chart.js"

import { Line } from "react-chartjs-2"

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
)

export default function CostChart({ vehicle }) {

  const labels = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"]

  const depreciation = labels.map((_, i) =>
    vehicle.price * (1 - 0.1 * i)
  )

  const data = {
    labels,
    datasets: [{
      label: "Predicted Value",
      data: depreciation,
      borderColor: "#f97316",
      tension: 0.4
    }]
  }

  return (
    <Line data={data} />
  )
}