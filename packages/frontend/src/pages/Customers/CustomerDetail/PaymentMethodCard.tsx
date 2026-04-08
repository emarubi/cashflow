import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const TABS = ['payment_method', 'options', 'settings'] as const
type Tab = typeof TABS[number]

interface PaymentMethodCardProps {
  hasPaymentMethod: boolean
}

export default function PaymentMethodCard({ hasPaymentMethod }: PaymentMethodCardProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('payment_method')

  const tabLabels: Record<Tab, string> = {
    payment_method: t('customer.payment_method'),
    options:        t('customer.options'),
    settings:       t('customer.settings'),
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment</h3>

      {/* Sub-tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        {TABS.map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`pb-2 text-xs font-medium border-b-2 transition-colors ${
              tab === k
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabLabels[k]}
          </button>
        ))}
      </div>

      {tab === 'payment_method' && (
        <div className="space-y-3">
          {!hasPaymentMethod ? (
            <div className="rounded-md bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
              <p className="font-medium mb-1">Collect a payment method</p>
              <p className="text-blue-700">
                Customers can save a payment method on the customer portal. This will ensure that future
                invoices are paid automatically and on time.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Payment method on file.</p>
          )}
        </div>
      )}

      {tab === 'options' && (
        <p className="text-xs text-gray-400">No options configured.</p>
      )}

      {tab === 'settings' && (
        <p className="text-xs text-gray-400">No settings configured.</p>
      )}
    </div>
  )
}
