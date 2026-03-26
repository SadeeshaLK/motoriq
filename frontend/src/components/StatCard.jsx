export default function StatCard({ title, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center">
      <div>
        <p className="text-gray-500">{title}</p>
        <h2 className={`text-2xl font-bold ${color}`}>{value}</h2>
      </div>
    </div>
  )
}