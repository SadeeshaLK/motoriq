export default function PriceBadge({ listed, estimated }) {

  const diff = listed - estimated
  const percent = ((diff / estimated) * 100).toFixed(1)

  let label = ""
  let style = ""

  if (percent <= 5 && percent >= -5) {
    label = "Fairly Priced!"
    style = "bg-green-100 text-green-600"
  } else if (percent < -5) {
    label = "Excellent Deal!"
    style = "bg-blue-100 text-blue-600"
  } else {
    label = "Overpriced!"
    style = "bg-red-100 text-red-600"
  }

  return (
    <div className={`px-4 py-2 rounded-full text-sm font-semibold w-fit ${style}`}>
      {label}
    </div>
  )
}