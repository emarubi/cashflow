import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInvoices } from '@/hooks/useInvoices'
import { useCreditNotes } from '@/hooks/useCreditNotes'
import InvoicesToolbar from './InvoicesToolbar'
import InvoicesTable from './InvoicesTable'
import CreditNotesTable from './CreditNotesTable'
import { InvoicesFilter } from './InvoicesFilterPanel'

type Tab = 'invoices' | 'credit_notes'

export default function InvoicesPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('invoices')
  const [filter, setFilter] = useState<InvoicesFilter>({
    statuses: ['due', 'overdue', 'in_dispute'],
    currency: '',
  })

  // Build the single-status filter for the API (the API only accepts one status at a time)
  // We pass no status filter when all are selected, otherwise the first selected one
  // In practice we show all by passing no filter and relying on the chips for UX
  const apiFilter = filter.statuses.length === 1
    ? { status: filter.statuses[0], ...(filter.currency ? { currency: filter.currency } : {}) }
    : { ...(filter.currency ? { currency: filter.currency } : {}) }

  const invoicesResult = useInvoices(activeTab === 'invoices' ? apiFilter : undefined)
  const creditNotesResult = useCreditNotes(
    activeTab === 'credit_notes'
      ? { ...(filter.currency ? { currency: filter.currency } : {}) }
      : undefined,
  )

  const unpaidCount = invoicesResult.totalCount

  return (
    <div className="flex flex-col h-full overflow-hidden p-8 max-w-screen-xl mx-auto">
      {/* Page title */}
      <h1 className="text-xl font-semibold text-gray-900 mb-4">{t('nav.invoices')}</h1>

    <div className="flex flex-col h-full overflow-hidden border border-gray-200 rounded-lg p-8">
      {/* Toolbar (tabs + filters) */}
      <InvoicesToolbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unpaidCount={unpaidCount}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Table area */}
      {activeTab === 'invoices' && (
        <InvoicesTable
          invoices={invoicesResult.invoices as Parameters<typeof InvoicesTable>[0]['invoices']}
          loading={invoicesResult.loading}
          totalCount={invoicesResult.totalCount}
          from={invoicesResult.from}
          to={invoicesResult.to}
          hasNextPage={invoicesResult.hasNextPage}
          hasPrevPage={invoicesResult.hasPrevPage}
          onNextPage={invoicesResult.nextPage}
          onPrevPage={invoicesResult.prevPage}
        />
      )}

      {activeTab === 'credit_notes' && (
        <CreditNotesTable
          creditNotes={creditNotesResult.creditNotes as Parameters<typeof CreditNotesTable>[0]['creditNotes']}
          loading={creditNotesResult.loading}
          totalCount={creditNotesResult.totalCount}
          from={creditNotesResult.from}
          to={creditNotesResult.to}
          hasNextPage={creditNotesResult.hasNextPage}
          hasPrevPage={creditNotesResult.hasPrevPage}
          onNextPage={creditNotesResult.nextPage}
          onPrevPage={creditNotesResult.prevPage}
        />
      )}
      </div>
    </div>
  )
}
