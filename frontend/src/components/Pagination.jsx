export default function Pagination({ page, setPage }) {

  return (
    <div className="flex justify-center mt-10 gap-4">

      <button
        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
        className="px-4 py-2 bg-gray-200 rounded">
        Prev
      </button>

      <span className="px-4 py-2">
        Page {page}
      </span>

      <button
        onClick={() => setPage(prev => prev + 1)}
        className="px-4 py-2 bg-gray-200 rounded">
        Next
      </button>

    </div>
  )
}