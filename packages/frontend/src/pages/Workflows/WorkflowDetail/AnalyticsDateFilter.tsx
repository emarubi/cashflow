import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface AnalyticsDateFilterProps {
  startDate: string
  endDate: string
  onUpdate: (start: string, end: string) => void
}

export default function AnalyticsDateFilter({ startDate, endDate, onUpdate }: AnalyticsDateFilterProps) {
  const { t } = useTranslation()
  const [localStart, setLocalStart] = useState(startDate)
  const [localEnd, setLocalEnd] = useState(endDate)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{t('workflow.analytics_for')}</span>
        <input
          type="date"
          value={localStart}
          onChange={(e) => setLocalStart(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date"
          value={localEnd}
          onChange={(e) => setLocalEnd(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => onUpdate(localStart, localEnd)}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('workflow.update')}
        </button>
      </div>
      <p className="text-xs text-blue-600 hover:underline cursor-pointer ml-0">
        {t('workflow.analytics_hint')}
      </p>
    </div>
  )
}
