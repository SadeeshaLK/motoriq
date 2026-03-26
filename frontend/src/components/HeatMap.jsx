import { MapContainer, TileLayer } from "react-leaflet"
import "leaflet/dist/leaflet.css"

export default function HeatMap() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md mt-8">

      <h3 className="font-semibold mb-4">
        Suspicious Activity Heatmap
      </h3>

      <MapContainer
        center={[6.9271, 79.8612]}
        zoom={12}
        style={{ height: "300px", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>

    </div>
  )
}