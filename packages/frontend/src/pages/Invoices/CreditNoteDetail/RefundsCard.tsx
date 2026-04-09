import { useTranslation } from 'react-i18next'

export default function RefundsCard() {
  const { t } = useTranslation()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('credit_note.refunds')}</h3>

      <table className="w-full text-sm mb-2">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.refund_reference')}</th>
            <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.refund_source')}</th>
            <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.refund_method')}</th>
            <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.refund_received')}</th>
            <th className="pb-2 text-right text-xs font-medium text-gray-400 uppercase">{t('credit_note.refund_amount')}</th>
            <th className="pb-2 text-left text-xs font-medium text-gray-400 uppercase">{t('credit_note.refund_type')}</th>
          </tr>
        </thead>
      </table>

      <p className="text-sm text-gray-400 text-center py-4">{t('credit_note.no_refunds')}</p>
    </div>
  )
}
