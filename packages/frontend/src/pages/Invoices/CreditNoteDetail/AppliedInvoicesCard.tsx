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

interface AppliedInvoicesCardProps {
  creditNote: {
    amount: number
    amountApplied: number
    currency: string
    invoice: {
      id: string
      number: string
      issueDate: string
      amount: number
      currency: string
      debtor: { id: string; name: string }
    } | null
  }
}

export default function AppliedInvoicesCard({ creditNote }: AppliedInvoicesCardProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t('credit_note.applied_invoices')}</h3>
        <button className="text-xs px-2.5 py-1.5 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
          {t('credit_note.link_credit_note')}
        </button>
      </div>

      {!creditNote.invoice ? (
        <p className="text-sm text-gray-400 text-center py-4">{t('credit_note.no_applied_invoices')}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.col_customer')}</th>
              <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.col_invoice')}</th>
              <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.col_issue_date')}</th>
              <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.col_title')}</th>
              <th className="pb-2 text-right text-xs font-medium text-gray-400 uppercase">{t('credit_note.col_total')}</th>
              <th className="pb-2 text-right text-xs font-medium text-gray-400 uppercase">{t('credit_note.col_amount_applied')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="py-2">
                <Link
                  to={`/${companySlug}/customers/${creditNote.invoice.debtor.id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {creditNote.invoice.debtor.name}
                </Link>
              </td>
              <td className="py-2">
                <Link
                  to={`/${companySlug}/invoices/${creditNote.invoice.id}`}
                  className="font-mono text-xs text-blue-600 hover:underline"
                >
                  {creditNote.invoice.number}
                </Link>
              </td>
              <td className="py-2 text-xs text-gray-600">{formatDate(creditNote.invoice.issueDate)}</td>
              <td className="py-2 text-xs text-gray-600">—</td>
              <td className="py-2 text-right text-xs font-medium text-gray-900">
                {formatCurrency(creditNote.invoice.amount, creditNote.invoice.currency)}
              </td>
              <td className="py-2 text-right text-xs font-medium text-gray-900">
                {formatCurrency(creditNote.amountApplied, creditNote.currency)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  )
}
