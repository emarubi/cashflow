import { useTranslation } from 'react-i18next'
import { WorkflowAction } from '@/hooks/useWorkflow'
import { ActionStats } from '@/hooks/useWorkflowActionStats'

interface ActionRowProps {
  action: WorkflowAction
  stats: ActionStats | undefined
}

function IconEmail() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function IconCall() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function IconLetter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatPercent(n: number): string {
  return `${Math.round(n * 100)}%`
}

export default function ActionRow({ action, stats }: ActionRowProps) {
  const { t } = useTranslation()
  const na = '—'

  const channelIcon =
    action.channel === 'email' ? <IconEmail /> :
    action.channel === 'call'  ? <IconCall /> :
    <IconLetter />

  const channelBg =
    action.channel === 'email' ? 'bg-blue-100 text-blue-600' :
    action.channel === 'call'  ? 'bg-gray-200 text-gray-600' :
    'bg-gray-100 text-gray-500'

  const displayName = action.template?.name ?? action.senderName ?? na

  let timingLabel = ''
  if (action.trigger === 'on_issue') {
    timingLabel = t('workflow.on_issue_date')
  } else if (action.trigger === 'before_due') {
    timingLabel = t('workflow.days_before_due', { count: Math.abs(action.delayDays) })
  } else {
    timingLabel = t('workflow.days_after_due', { count: action.delayDays })
  }

  return (
    <div className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Channel icon */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${channelBg}`}>
        {channelIcon}
      </div>

      {/* Name + timing */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
        <p className="text-xs text-gray-400">{timingLabel}</p>
      </div>

      {/* Analytics */}
      <div className="flex items-center gap-8 flex-shrink-0 text-sm text-right">
        {/* Performed actions */}
        <div className="w-16 text-right">
          <span className="text-gray-700 font-medium">
            {stats != null ? stats.performedActionsCount : na}
          </span>
        </div>

        {/* Open rate */}
        <div className="w-16 text-right">
          {action.channel === 'email' && stats?.openRate != null
            ? <span className="text-green-600 font-medium">{formatPercent(stats.openRate)}</span>
            : <span className="text-gray-400">{na}</span>
          }
        </div>

        {/* Collected */}
        <div className="w-24 text-right">
          <span className="text-gray-700 font-medium">
            {stats != null ? formatCurrency(stats.collected) : na}
          </span>
        </div>
      </div>
    </div>
  )
}
