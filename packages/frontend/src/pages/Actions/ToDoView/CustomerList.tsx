import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useActionsToDoByDebtor, ActionToDoSort, ActionToDoDebtor } from '@/hooks/useActionsToDoByDebtor'
import CustomerListItem from './CustomerListItem'

function useDebounce(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  const handler = useCallback(
    (v: string) => {
      const timer = setTimeout(() => setDebounced(v), delay)
      return () => clearTimeout(timer)
    },
    [delay],
  )
  return { debounced, handler }
}

const SORT_OPTIONS: { value: ActionToDoSort; labelKey: string }[] = [
  { value: 'OVERDUE_DESC', labelKey: 'actions.sort_overdue_desc' },
  { value: 'OUTSTANDING_DESC', labelKey: 'actions.sort_outstanding_desc' },
  { value: 'NEXT_ACTION_DATE_ASC', labelKey: 'actions.sort_next_action_asc' },
]

interface Props {
  selectedId: string | null
  onSelect: (debtor: ActionToDoDebtor) => void
}

export default function CustomerList({ selectedId, onSelect }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<ActionToDoSort>('NEXT_ACTION_DATE_ASC')
  const [sortOpen, setSortOpen] = useState(false)
  const { debounced: debouncedSearch, handler: handleSearchChange } = useDebounce(search)

  function onSearch(v: string) {
    setSearch(v)
    handleSearchChange(v)
  }

  const { debtors, totalCount, loading, error } = useActionsToDoByDebtor(
    debouncedSearch || undefined,
    sort,
  )

  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.labelKey ?? ''

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      {/* Search & Filter header */}
      <div className="p-3 border-b border-gray-200 space-y-2">
        <div className="relative">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            {t(currentSortLabel)}
            <svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {sortOpen && (
            <div className="absolute left-0 top-full mt-1 z-10 w-52 bg-white border border-gray-200 rounded-md shadow-lg py-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setSort(opt.value); setSortOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${sort === opt.value ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
          {totalCount} {t('actions.customers_todo')}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-sm text-gray-400">{t('common.loading')}</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-500">{t('common.error')}</div>
        )}
        {!loading && !error && debtors.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-400">{t('actions.no_todo')}</div>
        )}
        {debtors.map((debtor) => (
          <CustomerListItem
            key={debtor.id}
            debtor={debtor}
            selected={selectedId === debtor.id}
            onClick={() => onSelect(debtor)}
          />
        ))}
      </div>
    </div>
  )
}
