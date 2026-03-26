import DashboardLayout from "../layout/DashboardLayout"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement } from "chart.js"
import SuspiciousTable from "../components/SuspiciousTable"

ChartJS.register(CategoryScale, LinearScale, BarElement)

const chartData = {
  labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  datasets: [
    {
      label: "Listings",
      data: [40, 60, 80, 100, 120, 140],
      backgroundColor: "#f97316"
    }
  ]
}

export default function Dashboard() {
  return (
    <DashboardLayout title="Dashboard">

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="mb-4 font-semibold">
          Monthly Listing Growth
        </h3>

        <Bar data={chartData} />
      </div>

      <SuspiciousTable />

    </DashboardLayout>
  )
}