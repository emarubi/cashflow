import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export interface InvoicesFilter {
  statuses: string[]
  currency: string
}

const STATUSES = ['due', 'overdue', 'in_dispute', 'paid', 'draft']

interface InvoicesFilterPanelProps {
  filter: InvoicesFilter
  onChange: (f: InvoicesFilter) => void
  onClose: () => void
}

export default function InvoicesFilterPanel({ filter, onChange, onClose }: InvoicesFilterPanelProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  function toggleStatus(s: string) {
    const next = filter.statuses.includes(s)
      ? filter.statuses.filter((x) => x !== s)
      : [...filter.statuses, s]
    onChange({ ...filter, statuses: next })
  }

  const FILTER_ITEMS = [
    { key: 'status', label: t('invoice.filter_status') },
    { key: 'currency', label: t('invoice.filter_currency') },
  ]

  const [expanded, setExpanded] = useState<string | null>('status')

  return (
    <div
      ref={ref}
      className="absolute right-0 top-10 z-30 w-72 bg-white border border-gray-200 rounded-lg shadow-lg"
    >
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <span>{t('common.search')}...</span>
        </div>
      </div>

      {/* Filter items */}
      {FILTER_ITEMS.map((item) => (
        <div key={item.key} className="border-b border-gray-100 last:border-0">
          <button
            onClick={() => setExpanded(expanded === item.key ? null : item.key)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border border-gray-400 flex-shrink-0" />
              {item.label}
            </div>
            {item.key === 'status' && filter.statuses.length > 0 && (
              <span className="text-blue-600">✓</span>
            )}
            {item.key === 'currency' && filter.currency && (
              <span className="text-blue-600">✓</span>
            )}
          </button>

          {expanded === item.key && item.key === 'status' && (
            <div className="px-4 pb-3 space-y-1.5">
              {STATUSES.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filter.statuses.includes(s)}
                    onChange={() => toggleStatus(s)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="capitalize">{s.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          )}

          {expanded === item.key && item.key === 'currency' && (
            <div className="px-4 pb-3">
              <input
                type="text"
                value={filter.currency}
                onChange={(e) => onChange({ ...filter, currency: e.target.value.toUpperCase() })}
                placeholder="EUR, USD..."
                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
