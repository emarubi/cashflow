import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface TopDebtor {
  debtorId: string
  name: string
  outstanding: number
  invoiceCount: number
}

interface TopDebtorsListProps {
  debtors: TopDebtor[]
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default function TopDebtorsList({ debtors }: TopDebtorsListProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()
  const slug = companySlug ?? ''

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t('dashboard.main_debtors')}</h3>
        <Link to={`/${slug}/customers`} className="text-xs text-blue-600 hover:underline">
          {t('dashboard.see_more')}
        </Link>
      </div>
      <ul className="space-y-3">
        {debtors.map((d) => (
          <li key={d.debtorId} className="flex items-center justify-between">
            <div>
              <Link
                to={`/${slug}/customers/${d.debtorId}`}
                className="text-sm font-medium text-gray-900 hover:text-blue-600"
              >
                {d.name}
              </Link>
              <p className="text-xs text-gray-400">
                {t('dashboard.invoice_count', { count: d.invoiceCount })}
              </p>
            </div>
            <span className="text-sm font-semibold text-gray-700">{formatAmount(d.outstanding)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
