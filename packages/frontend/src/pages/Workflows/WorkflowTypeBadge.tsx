interface WorkflowTypeBadgeProps {
  firstActionLogic: string
}

export default function WorkflowTypeBadge({ firstActionLogic }: WorkflowTypeBadgeProps) {
  if (firstActionLogic === 'contextualized') {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300 text-gray-400">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <circle cx="5" cy="5" r="3" />
        </svg>
      </span>
    )
  }
  // standard
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300 text-gray-400">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="5" cy="5" r="3" />
      </svg>
    </span>
  )
}
