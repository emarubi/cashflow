import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import InvoicesFilterPanel, { InvoicesFilter } from './InvoicesFilterPanel'

type Tab = 'invoices' | 'credit_notes'

interface InvoicesToolbarProps {
  activeTab: Tab
  onTabChange: (t: Tab) => void
  unpaidCount: number
  filter: InvoicesFilter
  onFilterChange: (f: InvoicesFilter) => void
}

export default function InvoicesToolbar({
  activeTab,
  onTabChange,
  unpaidCount,
  filter,
  onFilterChange,
}: InvoicesToolbarProps) {
  const { t } = useTranslation()
  const [filterOpen, setFilterOpen] = useState(false)

  const activeFilterCount = filter.statuses.length + (filter.currency ? 1 : 0)

  function removeStatus(s: string) {
    onFilterChange({ ...filter, statuses: filter.statuses.filter((x) => x !== s) })
  }

  function clearAll() {
    onFilterChange({ statuses: [], currency: '' })
  }

  return (
    <div className="flex-shrink-0">
      {/* Tabs row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('invoices')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('nav.invoices')}
          </button>
          <button
            onClick={() => onTabChange('credit_notes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'credit_notes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('invoice.tab_credit_notes')}
          </button>
          {unpaidCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full font-medium">
              {t('invoice.unpaid_count', { count: unpaidCount })}
            </span>
          )}
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md transition-colors ${
              activeFilterCount > 0
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M10 20h4" />
            </svg>
            {t('common.filter')}
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-blue-600 text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button className="p-1.5 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button className="p-1.5 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
          </button>

          {filterOpen && (
            <InvoicesFilterPanel
              filter={filter}
              onChange={onFilterChange}
              onClose={() => setFilterOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {(filter.statuses.length > 0 || filter.currency) && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {filter.statuses.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full"
            >
              {t('invoice.filter_status')}: <span className="capitalize">{s.replace('_', ' ')}</span>
              <button onClick={() => removeStatus(s)} className="ml-0.5 text-gray-400 hover:text-gray-600">×</button>
            </span>
          ))}
          {filter.currency && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
              {t('invoice.filter_currency')}: {filter.currency}
              <button onClick={() => onFilterChange({ ...filter, currency: '' })} className="ml-0.5 text-gray-400 hover:text-gray-600">×</button>
            </span>
          )}
          <button onClick={clearAll} className="text-xs text-blue-600 hover:underline ml-1">
            {t('invoice.clear_filters')}
          </button>
        </div>
      )}
    </div>
  )
}
