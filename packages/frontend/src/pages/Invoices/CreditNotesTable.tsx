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

interface CreditNote {
  id: string
  number: string
  title: string | null
  source: string | null
  currency: string
  amount: number
  amountApplied: number
  status: string
  issueDate: string
  debtor: { id: string; name: string } | null
  invoice: { id: string; number: string } | null
}

interface CreditNotesTableProps {
  creditNotes: CreditNote[]
  loading: boolean
  totalCount: number
  from: number
  to: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onNextPage: () => void
  onPrevPage: () => void
}

export default function CreditNotesTable({
  creditNotes,
  loading,
  totalCount,
  from,
  to,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
}: CreditNotesTableProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('invoice.col_number')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('credit_note.col_source')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('credit_note.col_customer')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('credit_note.col_currency')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('credit_note.col_issue_date')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('credit_note.col_title')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('credit_note.col_applied_to')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap text-right">
                {t('credit_note.col_total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-sm text-gray-400">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading && creditNotes.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-sm text-gray-400">
                  {t('credit_note.no_credit_notes')}
                </td>
              </tr>
            )}
            {creditNotes.map((cn) => (
              <tr key={cn.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    to={`/${companySlug}/invoices/credit-notes/${cn.id}`}
                    className="font-mono text-sm text-blue-600 hover:underline"
                  >
                    {cn.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{cn.source ?? '—'}</td>
                <td className="px-4 py-3">
                  {cn.debtor ? (
                    <Link
                      to={`/${companySlug}/customers/${cn.debtor.id}`}
                      className="text-sm text-gray-800 hover:underline"
                    >
                      {cn.debtor.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 uppercase">{cn.currency}</td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDate(cn.issueDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{cn.title ?? '—'}</td>
                <td className="px-4 py-3">
                  {cn.invoice ? (
                    <Link
                      to={`/${companySlug}/invoices/${cn.invoice.id}`}
                      className="font-mono text-sm text-blue-600 hover:underline"
                    >
                      {cn.invoice.number}
                    </Link>
                  ) : (
                    <button className="text-xs px-2 py-1 border border-blue-500 text-blue-600 rounded hover:bg-blue-50 transition-colors">
                      {t('credit_note.apply_to_invoice')}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap font-medium">
                  {formatCurrency(cn.amount, cn.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white text-xs text-gray-500 flex-shrink-0">
          <span>
            {from}–{to} {t('invoice.of')} {totalCount}
          </span>
          <div className="flex items-center gap-3">
            <button onClick={onPrevPage} disabled={!hasPrevPage} className="disabled:opacity-40 hover:text-gray-700">
              ‹ {t('invoice.prev')}
            </button>
            <button onClick={onNextPage} disabled={!hasNextPage} className="disabled:opacity-40 hover:text-gray-700">
              {t('invoice.next')} ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
