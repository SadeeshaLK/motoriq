import { useState, useEffect, useRef } from "react"

export default function VehicleGallery({ images = [] }) {

  const [active, setActive] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const startX = useRef(null)

  if (!images || images.length === 0) {
    images = ["/no-image.png"]
  }

  const nextImage = () => {
    setActive((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  /* KEYBOARD NAVIGATION */

  useEffect(() => {

    const handleKey = (e) => {

      if (e.key === "ArrowRight") nextImage()
      if (e.key === "ArrowLeft") prevImage()
      if (e.key === "Escape") setFullscreen(false)

    }

    window.addEventListener("keydown", handleKey)

    return () => window.removeEventListener("keydown", handleKey)

  }, [])

  /* TOUCH SWIPE */

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e) => {

    if (!startX.current) return

    const diff = startX.current - e.changedTouches[0].clientX

    if (diff > 50) nextImage()
    if (diff < -50) prevImage()

    startX.current = null

  }

  return (
    <div className="w-full">

      {/* MAIN IMAGE */}

      <div
        className="relative group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >

        <img
          src={images[active]}
          className="w-full h-[420px] object-cover rounded-xl cursor-zoom-in transition duration-300 group-hover:scale-105"
          onClick={() => setFullscreen(true)}
          onError={(e)=>{
            e.target.onerror=null
            e.target.src="/no-image.png"
          }}
        />

        {/* IMAGE COUNTER */}

        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded">
          {active + 1} / {images.length}
        </div>

        {/* LEFT ARROW */}

        {images.length > 1 && (
          <button
            onClick={prevImage}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            ‹
          </button>
        )}

        {/* RIGHT ARROW */}

        {images.length > 1 && (
          <button
            onClick={nextImage}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition"
          >
            ›
          </button>
        )}

      </div>

      {/* THUMBNAILS */}

      {images.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">

          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              onClick={() => setActive(i)}
              className={`h-20 w-28 object-cover rounded-lg cursor-pointer border
              ${active === i
                ? "border-orange-500"
                : "border-transparent"
              }`}
            />
          ))}

        </div>
      )}

      {/* FULLSCREEN VIEWER */}

      {fullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">

          <img
            src={images[active]}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          {/* CLOSE */}

          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-6 right-6 text-white text-3xl"
          >
            ✕
          </button>

          {/* LEFT */}

          {images.length > 1 && (
            <button
              onClick={prevImage}
              className="absolute left-6 text-white text-4xl"
            >
              ‹
            </button>
          )}

          {/* RIGHT */}

          {images.length > 1 && (
            <button
              onClick={nextImage}
              className="absolute right-6 text-white text-4xl"
            >
              ›
            </button>
          )}

        </div>
      )}

    </div>
  )
}
