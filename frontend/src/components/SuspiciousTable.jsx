export default function SuspiciousTable() {

  const data = [
    { vehicle: "Toyota Aqua 2018", seller: "Samantha", listed: "5,200,000", estimated: "5,020,000", trust: 40 },
    { vehicle: "Honda Fit", seller: "Jayasinghe Motors", listed: "1,100,000", estimated: "1,000,000", trust: 30 }
  ]

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mt-8">

      <h3 className="text-lg font-semibold mb-4">
        Suspicious Vehicle Listings
      </h3>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="pb-2">Vehicle</th>
            <th>Seller</th>
            <th>Listed Price</th>
            <th>Estimated</th>
            <th>Trust</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="py-3">{item.vehicle}</td>
              <td>{item.seller}</td>
              <td>LKR {item.listed}</td>
              <td>LKR {item.estimated}</td>
              <td className="text-red-500 font-semibold">
                {item.trust}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}