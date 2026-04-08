interface ActionSectionHeaderProps {
  label: string
  variant: 'issued' | 'due'
}

export default function ActionSectionHeader({ label, variant }: ActionSectionHeaderProps) {
  const bg = variant === 'issued' ? 'bg-gray-800 text-white' : 'bg-red-500 text-white'
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-gray-200" />
      <span className={`${bg} text-xs font-medium px-3 py-1 rounded-full`}>{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}
