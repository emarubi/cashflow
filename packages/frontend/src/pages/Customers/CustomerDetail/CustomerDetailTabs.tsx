import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import InvoicesTab from './tabs/InvoicesTab'
import PaymentsTab from './tabs/PaymentsTab'
import CreditNotesTab from './tabs/CreditNotesTab'
import ContactsTab from './tabs/ContactsTab'
import TimelineTab from './tabs/TimelineTab'
import DetailsTab from './tabs/DetailsTab'

const TABS = ['invoices', 'payments', 'credit_notes', 'contacts', 'timeline', 'details'] as const
type Tab = typeof TABS[number]

interface CustomerDetailTabsProps {
  debtorId: string
  debtorEmail: string | null
}

export default function CustomerDetailTabs({ debtorId, debtorEmail }: CustomerDetailTabsProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('invoices')

  const tabLabels: Record<Tab, string> = {
    invoices:     t('customer.tab_invoices'),
    payments:     t('customer.tab_payments'),
    credit_notes: t('customer.tab_credit_notes'),
    contacts:     t('customer.tab_contacts'),
    timeline:     t('customer.tab_timeline'),
    details:      t('customer.tab_details'),
  }

  // Derive a basic contact from the debtor's own email
  const contacts = debtorEmail
    ? [{ email: debtorEmail, firstName: '', lastName: '', isMain: true }]
    : []

  return (
    <div className="flex flex-col h-full">
      {/* Tab nav */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'invoices'     && <InvoicesTab debtorId={debtorId} />}
        {activeTab === 'payments'     && <PaymentsTab debtorId={debtorId} />}
        {activeTab === 'credit_notes' && <CreditNotesTab />}
        {activeTab === 'contacts'     && <ContactsTab contacts={contacts} />}
        {activeTab === 'timeline'     && <TimelineTab debtorId={debtorId} />}
        {activeTab === 'details'      && <DetailsTab />}
      </div>
    </div>
  )
}
