const STATUS_STYLES: Record<string, string> = {
  overdue:    'text-red-600 bg-red-50',
  due:        'text-yellow-700 bg-yellow-50',
  paid:       'text-green-600 bg-green-50',
  in_dispute: 'text-purple-600 bg-purple-50',
  draft:      'text-gray-500 bg-gray-100',
}

const STATUS_LABELS: Record<string, string> = {
  overdue:    'Overdue',
  due:        'Due',
  paid:       'Paid',
  in_dispute: 'In dispute',
  draft:      'Draft',
}

interface InvoiceStatusBadgeProps {
  status: string
}

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] ?? 'text-gray-600 bg-gray-100'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
