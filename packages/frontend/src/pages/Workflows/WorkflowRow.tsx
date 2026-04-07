import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { WorkflowItem } from '@/hooks/useWorkflows'
import WorkflowTypeBadge from './WorkflowTypeBadge'

interface WorkflowRowProps {
  workflow: WorkflowItem
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatPercent(n: number): string {
  return `${Math.round(n * 100)}%`
}

export default function WorkflowRow({ workflow }: WorkflowRowProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()
  const slug = companySlug ?? ''
  const na = t('workflows.na')

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Type */}
      <td className="px-4 py-3">
        <WorkflowTypeBadge firstActionLogic={workflow.firstActionLogic} />
      </td>

      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Link
            to={`/${slug}/workflows/${workflow.id}`}
            className="text-sm font-medium text-gray-900 hover:text-blue-600"
          >
            {workflow.name}
          </Link>
          {workflow.isActive && (
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" title="Active" />
          )}
        </div>
      </td>

      {/* Customers */}
      <td className="px-4 py-3 text-right text-sm text-gray-700">
        {workflow.customerCount != null ? workflow.customerCount.toLocaleString() : na}
      </td>

      {/* Performed Actions */}
      <td className="px-4 py-3 text-right text-sm text-gray-700">
        {workflow.performedActionsCount != null ? workflow.performedActionsCount.toLocaleString() : na}
      </td>

      {/* Email open rate */}
      <td className="px-4 py-3 text-right text-sm text-gray-700">
        {workflow.emailOpenRate != null ? formatPercent(workflow.emailOpenRate) : na}
      </td>

      {/* Outstanding */}
      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
        {workflow.outstanding != null ? formatCurrency(workflow.outstanding) : na}
      </td>

      {/* DSO */}
      <td className="px-4 py-3 text-right text-sm text-gray-700">
        {workflow.dso != null
          ? t('workflows.days', { count: Math.round(workflow.dso) })
          : na}
      </td>

      {/* Actions menu */}
      <td className="px-4 py-3 text-right">
        <button className="text-gray-400 hover:text-gray-600 text-lg leading-none">⋯</button>
      </td>
    </tr>
  )
}
