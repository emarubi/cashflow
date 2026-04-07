import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'

export default function GreetingBlock() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col justify-center">
      <h2 className="text-xl font-semibold text-gray-900">
        {t('dashboard.greeting', { name: firstName })}
      </h2>
      <p className="mt-1 text-sm text-gray-500">{t('dashboard.subtitle')}</p>
    </div>
  )
}
