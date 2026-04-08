import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AddCustomersMenu from './AddCustomersMenu'

interface CustomersToolbarProps {
  search: string
  onSearch: (v: string) => void
}

export default function CustomersToolbar({ search, onSearch }: CustomersToolbarProps) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      {/* Left: view selector + search */}
      <div className="flex items-center gap-2 flex-1">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
          {t('customers.default_view')}
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t('common.search')}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Right: filter + add */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 .8 1.6L13 13.2V19a1 1 0 0 1-1.45.9l-4-2A1 1 0 0 1 7 17v-3.8L3.2 5.6A1 1 0 0 1 3 5V4z" />
          </svg>
          {t('common.filter')}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {t('customers.add')}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {menuOpen && <AddCustomersMenu onClose={() => setMenuOpen(false)} />}
        </div>
      </div>
    </div>
  )
}
