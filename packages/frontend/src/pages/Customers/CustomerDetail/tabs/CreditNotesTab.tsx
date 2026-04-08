import { useTranslation } from 'react-i18next'

export default function CreditNotesTab() {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('customer.tab_credit_notes')}</h3>
      <p className="text-sm text-gray-400">{t('customer.no_invoices')}</p>
    </div>
  )
}
