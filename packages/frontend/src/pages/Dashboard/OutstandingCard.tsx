import { useTranslation } from 'react-i18next'

interface OutstandingCardProps {
  totalUnpaid: number
  totalDue: number
  totalOverdue: number
  totalUnapplied: number
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default function OutstandingCard({ totalUnpaid, totalDue, totalOverdue, totalUnapplied }: OutstandingCardProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{t('dashboard.outstanding')}</p>
      <p className="text-3xl font-bold text-gray-900">{formatAmount(totalUnpaid)}</p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-gray-400">{t('dashboard.due')}</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-700">{formatAmount(totalDue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">{t('dashboard.overdue')}</p>
          <p className="mt-0.5 text-sm font-semibold text-red-600">{formatAmount(totalOverdue)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">{t('dashboard.unapplied')}</p>
          <p className="mt-0.5 text-sm font-semibold text-gray-700">{formatAmount(totalUnapplied)}</p>
        </div>
      </div>
    </div>
  )
}
