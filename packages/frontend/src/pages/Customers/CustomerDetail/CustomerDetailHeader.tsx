import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface CustomerDetailHeaderProps {
  name: string
}

export default function CustomerDetailHeader({ name }: CustomerDetailHeaderProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()
  const slug = companySlug ?? ''

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to={`/${slug}/customers`} className="hover:text-gray-700">
          {t('nav.customers')}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{name}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
          {t('customer.actions_todo')}
        </button>
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50">
          <span className="text-base leading-none">+</span>
          {t('customer.new_adhoc')}
        </button>
        <button className="px-2 py-1.5 text-sm border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50">
          •••
        </button>
      </div>
    </div>
  )
}
