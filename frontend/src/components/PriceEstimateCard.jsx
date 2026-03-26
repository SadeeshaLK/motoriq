export default function PriceEstimateCard({ listed, estimated }) {

  const diff = listed - estimated

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h3 className="font-semibold mb-4">
        Price Estimation
      </h3>

      <div className="space-y-3 text-sm">

        <div className="flex justify-between">
          <span>Listed Price</span>
          <span className="font-semibold">
            LKR {listed.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span>AI Estimated Price</span>
          <span className="font-semibold text-orange-500">
            LKR {estimated.toLocaleString()}
          </span>
        </div>

        <div className={`mt-4 text-sm font-semibold ${
          diff > 0 ? "text-red-500" : "text-green-500"
        }`}>
          {diff > 0
            ? `${Math.abs(diff).toLocaleString()} ABOVE estimate`
            : `${Math.abs(diff).toLocaleString()} BELOW estimate`}
        </div>

      </div>

    </div>
  )
}