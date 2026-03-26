export default function Hero() {
  return (
    <div
      className="h-[400px] bg-cover bg-center flex items-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70')"
      }}
    >
      <div className="bg-black/50 w-full h-full flex items-center px-20">
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-4">
            Find New & Used Cars in Sri Lanka
          </h1>
          <button className="bg-blue-500 px-6 py-3 rounded">
            View Details
          </button>
        </div>
      </div>
    </div>
  )
}