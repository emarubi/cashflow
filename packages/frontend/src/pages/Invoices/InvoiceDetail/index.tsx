import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useInvoice } from '@/hooks/useInvoice'
import InvoiceDetailHeader from './InvoiceDetailHeader'
import InvoiceInfoCard from './InvoiceInfoCard'
import PaymentsAndCreditNotesCard from './PaymentsAndCreditNotesCard'
import InvoiceTimelineCard from './InvoiceTimelineCard'

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { invoice, loading, error } = useInvoice(id ?? '')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        {t('common.error')}
      </div>
    )
  }

  const actionEvents = invoice.execution?.actionEvents ?? []

  return (
    <div className="p-8 max-w-screen-xl mx-auto flex flex-col h-full overflow-hidden">
      <InvoiceDetailHeader number={invoice.number} status={invoice.status} />

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Left sidebar */}
        <div className="w-2/5 flex-shrink-0 overflow-y-auto">
          <InvoiceInfoCard invoice={invoice} />
        </div>

        {/* Right panel */}
        <div className="w-3/5 min-w-0 flex flex-col overflow-hidden">
          <PaymentsAndCreditNotesCard invoiceId={invoice.id} currency={invoice.currency} />
          <InvoiceTimelineCard actionEvents={actionEvents} />
        </div>
      </div>
    </div>
  )
}
