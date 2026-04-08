import { useTranslation } from 'react-i18next'

export default function DetailsTab() {
  const { t } = useTranslation()

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('customer.tab_details')}</h3>
      <p className="text-sm text-gray-400">—</p>
    </div>
  )
}
