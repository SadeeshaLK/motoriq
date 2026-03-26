export default function CompareModal({ list, close }) {

  if (!list.length) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">

      <div className="bg-white p-8 rounded-xl w-4/5">

        <h2 className="text-xl font-bold mb-6">
          Vehicle Comparison
        </h2>

        <div className="grid grid-cols-3 gap-6">

          {list.map(vehicle => (
            <div key={vehicle._id} className="border p-4 rounded">

              <h3>{vehicle.brand}</h3>
              <p>Price: {vehicle.price}</p>
              <p>Mileage: {vehicle.mileage}</p>
              <p>Efficiency: {vehicle.fuelEfficiency}</p>
              <p>Maintenance: {vehicle.maintenanceLevel}</p>

            </div>
          ))}

        </div>

        <button
          onClick={close}
          className="mt-6 bg-orange-500 text-white px-6 py-2 rounded">
          Close
        </button>

      </div>

    </div>
  )
}