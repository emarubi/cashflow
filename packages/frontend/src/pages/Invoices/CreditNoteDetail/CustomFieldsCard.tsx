import { useTranslation } from 'react-i18next'

export default function CustomFieldsCard() {
  const { t } = useTranslation()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('invoice.custom_fields')}</h3>
      <div className="text-center py-6 text-sm text-gray-400 space-y-2">
        <p>{t('credit_note.no_custom_fields')}</p>
      </div>
      <button className="mt-2 text-xs text-blue-600 hover:underline w-full text-center">
        + {t('invoice.add_field')}
      </button>
    </div>
  )
}
