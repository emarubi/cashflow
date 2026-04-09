import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import InvoiceStatusBadge from './InvoiceStatusBadge'

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

interface Invoice {
  id: string
  number: string
  status: string
  issueDate: string
  dueDate: string
  amount: number
  outstanding: number
  currency: string
  debtor: { id: string; name: string }
}

interface InvoicesTableProps {
  invoices: Invoice[]
  loading: boolean
  totalCount: number
  from: number
  to: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onNextPage: () => void
  onPrevPage: () => void
}

export default function InvoicesTable({
  invoices,
  loading,
  totalCount,
  from,
  to,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
}: InvoicesTableProps) {
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
                {t('invoice.col_customer')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('invoice.col_status')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('invoice.col_issue_date')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                {t('invoice.col_due_date')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap text-right">
                {t('invoice.col_total')}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase whitespace-nowrap text-right">
                {t('invoice.col_outstanding')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-sm text-gray-400">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-sm text-gray-400">
                  {t('invoice.no_invoices')}
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    to={`/${companySlug}/invoices/${inv.id}`}
                    className="font-mono text-sm text-blue-600 hover:underline"
                  >
                    {inv.number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/${companySlug}/customers/${inv.debtor.id}`}
                    className="text-sm text-gray-800 hover:underline"
                  >
                    {inv.debtor.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDate(inv.issueDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDate(inv.dueDate)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap font-medium">
                  {formatCurrency(inv.amount, inv.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right whitespace-nowrap font-medium">
                  {formatCurrency(inv.outstanding, inv.currency)}
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
            <button
              onClick={onPrevPage}
              disabled={!hasPrevPage}
              className="disabled:opacity-40 hover:text-gray-700"
            >
              ‹ {t('invoice.prev')}
            </button>
            <button
              onClick={onNextPage}
              disabled={!hasNextPage}
              className="disabled:opacity-40 hover:text-gray-700"
            >
              {t('invoice.next')} ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
