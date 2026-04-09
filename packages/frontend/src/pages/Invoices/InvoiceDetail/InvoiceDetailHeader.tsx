import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import InvoiceStatusBadge from '../InvoiceStatusBadge'

interface InvoiceDetailHeaderProps {
  number: string
  status: string
}

export default function InvoiceDetailHeader({ number, status }: InvoiceDetailHeaderProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()

  return (
    <div className="flex items-center justify-between mb-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Breadcrumb */}
        <Link to={`/${companySlug}/invoices`} className="text-sm text-gray-500 hover:underline">
          {t('nav.invoices')}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-900">
          {t('invoice.invoice_number', { number })}
        </span>
        <InvoiceStatusBadge status={status} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          {t('invoice.no_action')}
        </span>
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
          + {t('invoice.new_adhoc')}
        </button>
      </div>
    </div>
  )
}
