export default function CategoryChips({ selected, setSelected }) {

  const categories = ["All", "SUV", "Sedan", "Hatchback", "Hybrid", "Electric"]

  return (
    <div className="flex gap-4 mb-8">

      {categories.map(category => (
        <button
          key={category}
          onClick={() => {
            setSelected(category)
            setPage(1)
          }}
          className={`px-5 py-2 rounded-full text-sm transition
            ${selected === category
              ? "bg-orange-500 text-white shadow-md"
              : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          {category}
        </button>
      ))}

    </div>
  )
}