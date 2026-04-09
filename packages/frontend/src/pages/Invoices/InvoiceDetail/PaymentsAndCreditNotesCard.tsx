import { useTranslation } from 'react-i18next'
import { useInvoicePayments } from '@/hooks/useInvoicePayments'

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

interface PaymentsAndCreditNotesCardProps {
  invoiceId: string
  currency: string
}

export default function PaymentsAndCreditNotesCard({ invoiceId, currency }: PaymentsAndCreditNotesCardProps) {
  const { t } = useTranslation()
  const { payments, loading } = useInvoicePayments(invoiceId)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {t('invoice.payments_and_credit_notes')}
        </h3>
        <button className="text-xs px-2.5 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          {t('invoice.add_payment')}
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-400 text-center py-4">{t('common.loading')}</p>
      )}

      {!loading && payments.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-6">
          {t('invoice.no_payments_yet')}
        </p>
      )}

      {!loading && payments.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">
                {t('invoice.payment_reference')}
              </th>
              <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">
                {t('invoice.payment_method')}
              </th>
              <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">
                {t('invoice.payment_status')}
              </th>
              <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">
                {t('invoice.payment_date')}
              </th>
              <th className="pb-2 text-right text-xs font-medium text-gray-400 uppercase">
                {t('invoice.payment_amount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {(payments as Array<{
              id: string
              reference: string
              method: string | null
              status: string
              receivedAt: string
              amount: number
              currency: string
            }>).map((p) => (
              <tr key={p.id} className="border-b border-gray-50">
                <td className="py-2 font-mono text-xs text-gray-700">{p.reference}</td>
                <td className="py-2 text-xs text-gray-600 capitalize">{p.method ?? '—'}</td>
                <td className="py-2">
                  <span className="text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded capitalize">
                    {p.status}
                  </span>
                </td>
                <td className="py-2 text-xs text-gray-600">{formatDate(p.receivedAt)}</td>
                <td className="py-2 text-right text-xs font-medium text-gray-900">
                  {formatCurrency(p.amount, p.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
