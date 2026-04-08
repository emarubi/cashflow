import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function GroupEntitiesCard() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('customer.group_entities')}</h3>
        <button className="text-xs text-blue-600 hover:underline">{t('customers.create')}</button>
      </div>

      <div className="relative mb-3">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search')}
          className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-1.5 text-left font-medium text-gray-500">Item</th>
            <th className="pb-1.5 text-right font-medium text-gray-500">{t('customer.amount_due')}</th>
            <th className="pb-1.5 text-right font-medium text-gray-500">{t('customer.amount_overdue')}</th>
            <th className="w-4" />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={4} className="py-4 text-center text-gray-400">
              —
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
