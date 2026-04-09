import { useTranslation } from 'react-i18next'
import { WorkflowItem } from '@/hooks/useWorkflows'
import WorkflowRow from './WorkflowRow'

interface WorkflowsTableProps {
  workflows: WorkflowItem[]
}

export default function WorkflowsTable({ workflows }: WorkflowsTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-12">
              {t('workflows.col_type')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t('workflows.col_name')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
              {t('workflows.col_customers')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
              {t('workflows.col_actions')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
              {t('workflows.col_open_rate')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
              {t('workflows.col_outstanding')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
              {t('workflows.col_dso')}
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {workflows.map((w) => (
            <WorkflowRow key={w.id} workflow={w} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
