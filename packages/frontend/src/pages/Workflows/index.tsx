import { useTranslation } from 'react-i18next'

export default function WorkflowsPage() {
  const { t } = useTranslation()
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">{t('nav.workflows')}</h1>
    </div>
  )
}
