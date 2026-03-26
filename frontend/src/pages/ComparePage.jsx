export default function ComparePage({ vehicles }) {

  return (

    <div className="p-16 grid grid-cols-3 gap-6">

      {vehicles.map(v=>(
        <div key={v._id} className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-bold">
            {v.brand} {v.model}
          </h2>

          <p>Price: {v.price}</p>
          <p>Mileage: {v.mileage}</p>
          <p>Fuel: {v.fuelType}</p>
          <p>Transmission: {v.transmission}</p>

        </div>
      ))}

    </div>

  )
}
