import { useTranslation } from 'react-i18next'

export default function BankPage() {
  const { t } = useTranslation()
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">{t('nav.bank')}</h1>
    </div>
  )
}
