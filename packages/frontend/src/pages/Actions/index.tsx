import { useTranslation } from 'react-i18next'

export default function ActionsPage() {
  const { t } = useTranslation()
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">{t('nav.actions')}</h1>
    </div>
  )
}
