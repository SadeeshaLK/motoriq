export default function CategoryChips({ selected, setSelected }) {

  const categories = ["All", "SUV", "Sedan", "Hatchback", "Hybrid", "Electric"]

  return (
    <div className="flex gap-2 flex-wrap">

      {categories.map(category => (
        <button
          key={category}
          onClick={() => setSelected(category)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            selected === category
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
              : ""
          }`}
          style={selected === category
            ? { boxShadow: '0 4px 14px var(--primary-glow)' }
            : { background: 'var(--chip-bg)', border: '1px solid var(--chip-border)', color: 'var(--chip-text)' }
          }
        >
          {category}
        </button>
      ))}

    </div>
  )
}