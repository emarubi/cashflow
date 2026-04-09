import { useTranslation } from 'react-i18next'
import { useWorkflows } from '@/hooks/useWorkflows'
import WorkflowsTable from './WorkflowsTable'

export default function WorkflowsPage() {
  const { t } = useTranslation()
  const { data, loading, error } = useWorkflows()

  return (
    <div className="p-8 max-w-screen-xl mx-auto ">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-900">{t('nav.workflows')}</h1>
        <button className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          {t('workflows.new')}…
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {t('workflows.subtitle')}{' '}
        <button className="text-blue-600 hover:underline text-sm">{t('workflows.how_to')}</button>
      </p>

      {/* Content */}
      {loading && (
        <p className="text-sm text-gray-400">{t('common.loading')}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{t('common.error')}</p>
      )}
      {data && <WorkflowsTable workflows={data} />}
    </div>
  )
}
