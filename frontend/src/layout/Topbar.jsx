export default function Topbar({ title }) {
  return (
    <div className="ml-64 bg-white shadow-sm px-10 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-semibold text-gray-700">
        {title}
      </h1>

      <div className="flex items-center gap-6">
        <span className="text-gray-600">Welcome, Admin</span>
        <div className="w-8 h-8 rounded-full bg-gray-300"></div>
      </div>
    </div>
  )
}