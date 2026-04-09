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

const STATUS_STYLES: Record<string, string> = {
  unapplied: 'text-yellow-700 bg-yellow-50',
  applied:   'text-green-600 bg-green-50',
  partial:   'text-blue-600 bg-blue-50',
}

interface CreditNoteInfoCardProps {
  creditNote: {
    number: string
    title: string | null
    source: string | null
    currency: string
    amount: number
    amountApplied: number
    status: string
    issueDate: string
    debtor: { id: string; name: string } | null
  }
}

export default function CreditNoteInfoCard({ creditNote }: CreditNoteInfoCardProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">{t('credit_note.section_title')}</h3>

      {/* Customer */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{t('credit_note.customer')}</p>
        {creditNote.debtor ? (
          <Link
            to={`/${companySlug}/customers/${creditNote.debtor.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            {creditNote.debtor.name}
          </Link>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </div>

      {/* Title */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{t('credit_note.title')}</p>
        <p className="text-sm text-gray-800">{creditNote.title ?? '—'}</p>
      </div>

      {/* Issue date */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{t('credit_note.issue_date')}</p>
        <p className="text-sm text-gray-800">{formatDate(creditNote.issueDate)}</p>
      </div>

      {/* External status */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{t('credit_note.external_status')}</p>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[creditNote.status] ?? 'text-gray-600 bg-gray-100'}`}
        >
          {creditNote.status}
        </span>
      </div>

      {/* Amount applied */}
      <div>
        <p className="text-xs text-gray-400 mb-1">{t('credit_note.amount_applied')}</p>
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(creditNote.amountApplied, creditNote.currency)}
        </p>
      </div>

      {/* Total amount */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-1">{t('credit_note.total_amount')}</p>
        <p className="text-sm font-semibold text-gray-900">
          {formatCurrency(creditNote.amount, creditNote.currency)}
        </p>
      </div>

      {/* PDF download */}
      <div className="pt-2 border-t border-gray-100">
        <button className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 border border-gray-200 rounded px-2 py-1.5 w-full">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="truncate">Credit Note {creditNote.number}.pdf</span>
          <span className="ml-auto text-blue-600 font-medium flex-shrink-0">{t('credit_note.download')}</span>
        </button>
      </div>
    </div>
  )
}
