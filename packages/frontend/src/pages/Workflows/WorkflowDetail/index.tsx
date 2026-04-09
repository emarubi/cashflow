import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useWorkflow } from '@/hooks/useWorkflow'
import { useWorkflowActionStats } from '@/hooks/useWorkflowActionStats'
import WorkflowTitle from './WorkflowTitle'
import WorkflowSettingsCard from './WorkflowSettingsCard'
import AnalyticsDateFilter from './AnalyticsDateFilter'
import WorkflowActionsSection from './WorkflowActionsSection'

function defaultDateRange(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 3)
  start.setDate(1)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: fmt(start), end: fmt(end) }
}

export default function WorkflowDetailPage() {
  const { t } = useTranslation()
  const { companySlug, id } = useParams<{ companySlug: string; id: string }>()
  const slug = companySlug ?? ''
  const workflowId = id ?? ''

  const [dateRange, setDateRange] = useState(defaultDateRange)

  const { data: workflow, loading, error } = useWorkflow(workflowId)
  const { statsMap } = useWorkflowActionStats(workflowId, dateRange.start, dateRange.end)

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">{t('common.loading')}</div>
  }
  if (error || !workflow) {
    return <div className="p-6 text-sm text-red-500">{t('common.error')}</div>
  }

  return (
    <div className="p-8 max-w-screen-xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link to={`/${slug}/workflows`} className="hover:text-gray-600">
          {t('nav.workflows')}
        </Link>
        <span>/</span>
        <span className="text-gray-600">{workflow.name}</span>
      </div>

      {/* Editable title */}
      <WorkflowTitle workflowId={workflow.id} name={workflow.name} />

      {/* Settings card */}
      <WorkflowSettingsCard workflow={workflow} />

      {/* Analytics date filter */}
      <AnalyticsDateFilter
        startDate={dateRange.start}
        endDate={dateRange.end}
        onUpdate={(start, end) => setDateRange({ start, end })}
      />

      {/* Actions list */}
      <WorkflowActionsSection workflowId={workflow.id} actions={workflow.actions} statsMap={statsMap} />
    </div>
  )
}
