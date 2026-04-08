import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WorkflowDetail } from '@/hooks/useWorkflow'
import { useUpdateWorkflow } from '@/hooks/useUpdateWorkflow'

const DELAY_OPTIONS = [1, 2, 3, 5, 7, 10, 14, 21, 30]

interface WorkflowSettingsCardProps {
  workflow: WorkflowDetail
}

export default function WorkflowSettingsCard({ workflow }: WorkflowSettingsCardProps) {
  const { t } = useTranslation()
  const { updateWorkflow, loading } = useUpdateWorkflow(workflow.id)

  const [minDelay, setMinDelay] = useState(workflow.minContactDelayDays)
  const [replyMode, setReplyMode] = useState<'sender' | 'custom'>(
    workflow.replyTo ? 'custom' : 'sender',
  )
  const [customEmail, setCustomEmail] = useState(workflow.replyTo ?? '')
  const [firstActionLogic, setFirstActionLogic] = useState(workflow.firstActionLogic)

  async function handleSave() {
    await updateWorkflow({
      minContactDelayDays: minDelay,
      replyTo: replyMode === 'custom' ? customEmail || null : null,
      firstActionLogic,
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Minimum contact delay */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{t('workflow.min_delay')}</p>
          <p className="mt-0.5 text-xs text-gray-500">{t('workflow.min_delay_desc')}</p>
          <p className="text-xs text-gray-400">{t('workflow.min_delay_recommend')}</p>
        </div>
        <select
          value={minDelay}
          onChange={(e) => setMinDelay(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DELAY_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {t('workflow.days', { count: d })}
            </option>
          ))}
        </select>
      </div>

      <hr className="border-gray-100" />

      {/* Reply to */}
      <div>
        <p className="text-sm font-medium text-gray-900">{t('workflow.reply_to')}</p>
        <p className="mt-0.5 text-xs text-gray-500 mb-3">{t('workflow.reply_to_desc')}</p>
        <div className="flex items-center gap-6 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="replyMode"
              checked={replyMode === 'sender'}
              onChange={() => setReplyMode('sender')}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">{t('workflow.email_sender')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="replyMode"
              checked={replyMode === 'custom'}
              onChange={() => setReplyMode('custom')}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">{t('workflow.custom_address')}</span>
          </label>
          {replyMode === 'custom' && (
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder={t('workflow.custom_email_placeholder')}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
            />
          )}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* First action logic */}
      <div>
        <p className="text-sm font-medium text-gray-900">{t('workflow.first_action_logic')}</p>
        <p className="mt-0.5 text-xs text-gray-500 mb-3">{t('workflow.first_action_desc')}</p>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="firstActionLogic"
              checked={firstActionLogic === 'standard'}
              onChange={() => setFirstActionLogic('standard')}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">{t('workflow.standard')}</span>
            <span className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-xs flex items-center justify-center cursor-help" title="Standard logic applies the first action on the first matching trigger">?</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="firstActionLogic"
              checked={firstActionLogic === 'contextualized'}
              onChange={() => setFirstActionLogic('contextualized')}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">{t('workflow.contextualized')}</span>
            <span className="w-4 h-4 rounded-full border border-gray-300 text-gray-400 text-xs flex items-center justify-center cursor-help" title="Contextualized logic picks the most relevant action based on invoice age">?</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? t('common.loading') : t('workflow.save')}
        </button>
      </div>
    </div>
  )
}
