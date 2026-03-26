import DashboardLayout from "../layout/DashboardLayout"
import VehicleCard from "../components/VehicleCard"

export default function Vehicles() {
  return (
    <DashboardLayout title="Vehicles">

      <div className="grid grid-cols-2 gap-8">

        <VehicleCard
          title="Toyota Aqua Hybrid 2018"
          price="LKR 5,120,000"
          image="https://images.unsplash.com/photo-1553440569-bcc63803a83d"
        />

        <VehicleCard
          title="Honda Fit 2015"
          price="LKR 3,800,000"
          image="https://images.unsplash.com/photo-1549921296-3a5c1d8d0f11"
        />

      </div>

    </DashboardLayout>
  )
}