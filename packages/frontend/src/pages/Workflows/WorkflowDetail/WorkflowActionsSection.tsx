import { useTranslation } from 'react-i18next'
import { WorkflowAction } from '@/hooks/useWorkflow'
import { StatsMap } from '@/hooks/useWorkflowActionStats'
import ActionSectionHeader from './ActionSectionHeader'
import ActionRow from './ActionRow'

interface WorkflowActionsSectionProps {
  actions: WorkflowAction[]
  statsMap: StatsMap
}

export default function WorkflowActionsSection({ actions, statsMap }: WorkflowActionsSectionProps) {
  const { t } = useTranslation()

  const sorted = [...actions].sort((a, b) => a.stepOrder - b.stepOrder)
  const onIssue    = sorted.filter((a) => a.trigger === 'on_issue')
  const beforeDue  = sorted.filter((a) => a.trigger === 'before_due')
  const afterDue   = sorted.filter((a) => a.trigger === 'after_due')

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Billing template (on_issue actions) */}
      {onIssue.map((a) => (
        <div key={a.id} className="flex items-center gap-3 py-3 px-2 border border-gray-200 rounded-lg mb-4">
          <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">{t('workflow.billing_template')}</p>
            <p className="text-xs text-gray-400">{t('workflow.on_issue_date')}</p>
          </div>
        </div>
      ))}

      {/* New action button */}
      <button className="flex items-center gap-2 text-sm text-blue-600 font-medium mb-4 hover:opacity-80 transition-opacity">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-base leading-none">+</span>
        {t('workflow.new_action')}
      </button>

      {/* Column headers */}
      <div className="flex items-center gap-4 px-2 mb-1">
        <div className="flex-1" />
        <div className="flex items-center gap-8 text-xs text-gray-400 flex-shrink-0">
          <span className="w-16 text-right">{t('workflow.col_actions')}</span>
          <span className="w-16 text-right">{t('workflow.col_open_rate')}</span>
          <span className="w-24 text-right">{t('workflow.col_collected')}</span>
        </div>
      </div>

      {/* Invoice Issued section */}
      {beforeDue.length > 0 && (
        <>
          <ActionSectionHeader label={t('workflow.section_issued')} variant="issued" />
          {beforeDue.map((a) => (
            <ActionRow key={a.id} action={a} stats={statsMap[a.id]} />
          ))}
        </>
      )}

      {/* Invoice due section */}
      {afterDue.length > 0 && (
        <>
          <ActionSectionHeader label={t('workflow.section_due')} variant="due" />
          {afterDue.map((a) => (
            <ActionRow key={a.id} action={a} stats={statsMap[a.id]} />
          ))}
        </>
      )}
    </div>
  )
}
