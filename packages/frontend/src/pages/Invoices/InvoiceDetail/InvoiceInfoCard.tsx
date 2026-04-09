import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

function formatCurrency(n: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso))
}

interface InvoiceInfoCardProps {
  invoice: {
    number: string
    amount: number
    outstanding: number
    currency: string
    issueDate: string
    dueDate: string
    debtor: {
      id: string
      name: string
      assignedUser: { id: string; name: string } | null
      workflow: { id: string; name: string } | null
    }
    execution: {
      id: string
      status: string
      workflow: { id: string; name: string } | null
    } | null
  }
}

export default function InvoiceInfoCard({ invoice }: InvoiceInfoCardProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Amount figures */}
      <div className="grid grid-cols-3 gap-3 pb-3 border-b border-gray-100">
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">{t('invoice.total')}</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(invoice.amount, invoice.currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">{t('invoice.outstanding')}</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(invoice.outstanding, invoice.currency)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400 mb-1">{t('invoice.due')}</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(invoice.outstanding, invoice.currency)}
          </p>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 pb-3 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-400 mb-1">{t('invoice.due_date')}</p>
          <p className="text-sm text-gray-800">{formatDate(invoice.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">{t('invoice.issue_date')}</p>
          <p className="text-sm text-gray-800">{formatDate(invoice.issueDate)}</p>
        </div>
      </div>

      {/* Customer */}
      <div className="pb-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">{t('invoice.customer')}</p>
        <Link
          to={`/${companySlug}/customers/${invoice.debtor.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          {invoice.debtor.name}
        </Link>
      </div>

      {/* Assigned user */}
      <div className="pb-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">{t('invoice.assigned_users')}</p>
        {invoice.debtor.assignedUser ? (
          <p className="text-sm text-gray-800">{invoice.debtor.assignedUser.name}</p>
        ) : (
          <p className="text-sm text-gray-400">{t('invoice.no_assigned_user')}</p>
        )}
      </div>

      {/* Workflow */}
      <div className="pb-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">{t('invoice.workflow')}</p>
        {invoice.execution?.workflow ? (
          <span className="inline-flex items-center gap-1 text-sm text-gray-800">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {invoice.execution.workflow.name}
          </span>
        ) : (
          <span className="text-sm text-gray-400">{t('invoice.no_workflow')}</span>
        )}
      </div>

      {/* Promise to pay */}
      <div className="pb-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">{t('invoice.promise_to_pay')}</p>
        <button className="text-xs text-blue-600 hover:underline">+ {t('invoice.add_field')}</button>
      </div>

      {/* Custom fields */}
      <div>
        <p className="text-xs text-gray-400 mb-2">{t('invoice.custom_fields')}</p>
        <button className="text-xs text-blue-600 hover:underline">+ {t('invoice.add_field')}</button>
      </div>
    </div>
  )
}
