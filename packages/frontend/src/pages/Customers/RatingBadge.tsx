interface RatingBadgeProps {
  rating: string | null | undefined
}

const ratingStyles: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-yellow-100 text-yellow-700',
  C: 'bg-orange-100 text-orange-700',
  D: 'bg-red-100 text-red-700',
}

export default function RatingBadge({ rating }: RatingBadgeProps) {
  if (!rating) return <span className="text-gray-400 text-sm">—</span>
  const style = ratingStyles[rating] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${style}`}>
      {rating}
    </span>
  )
}
