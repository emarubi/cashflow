import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useDebtorActiveExecutions } from '@/hooks/useDebtorActiveExecutions'
import { useSendAction } from '@/hooks/useSendAction'
import { usePauseExecution } from '@/hooks/usePauseExecution'
import { useIgnoreAction } from '@/hooks/useIgnoreAction'
import { useAuth } from '@/contexts/AuthContext'

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  email: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  call: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  letter: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

interface Props {
  debtorId: string
}

export default function ActionDetailPanel({ debtorId }: Props) {
  const { t } = useTranslation()
  const { user, company } = useAuth()
  const [currentInvoiceIdx, setCurrentInvoiceIdx] = useState(0)

  const { debtor, activeInvoices, loading, error, refetch } = useDebtorActiveExecutions(debtorId)
  const { sendAction, loading: sending } = useSendAction(debtorId)
  const { pauseExecution, loading: pausing } = usePauseExecution(debtorId)
  const { ignoreAction, loading: ignoring } = useIgnoreAction(debtorId)

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">{t('common.loading')}</div>
  }
  if (error || !debtor) {
    return <div className="flex-1 flex items-center justify-center text-sm text-red-400">{t('common.error')}</div>
  }

  if (activeInvoices.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-400">{t('actions.no_active_executions')}</p>
      </div>
    )
  }

  const invoice = activeInvoices[currentInvoiceIdx] ?? activeInvoices[0]
  const execution = invoice.execution!
  const action = execution.currentAction!
  const template = action.template

  async function handleSend() {
    await sendAction(execution.id, action.id)
    refetch()
  }

  async function handlePause() {
    await pauseExecution(execution.id)
    refetch()
  }

  async function handleIgnore() {
    await ignoreAction(execution.id, action.id)
    refetch()
  }

  const companySlug = company?.slug ?? ''

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              to={`/${companySlug}/customers/${debtor.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
            >
              {debtor.name}
            </Link>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
              {debtor.assignedUser && <span>{debtor.assignedUser.name}</span>}
              {debtor.workflow && <span className="text-gray-400">·</span>}
              {debtor.workflow && <span>{debtor.workflow.name}</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-bold text-gray-900">{fmt.format(debtor.outstandingAmount)}</p>
            {debtor.overdueAmount > 0 && (
              <p className="text-sm text-red-500">{fmt.format(debtor.overdueAmount)} {t('actions.overdue')}</p>
            )}
          </div>
        </div>

        {/* Invoice selector if multiple active */}
        {activeInvoices.length > 1 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {activeInvoices.map((inv, idx) => (
              <button
                key={inv.id}
                onClick={() => setCurrentInvoiceIdx(idx)}
                className={`px-2 py-1 text-xs rounded border ${currentInvoiceIdx === idx ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {inv.number}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action info */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-gray-400">{CHANNEL_ICON[action.channel]}</span>
          <span className="font-medium capitalize">{t(`actions.channel.${action.channel}`)}</span>
          <span className="text-gray-400">·</span>
          <span className="text-gray-500">
            {action.trigger === 'before_due'
              ? t('workflow.days_before_due', { count: action.delayDays })
              : action.trigger === 'after_due'
              ? t('workflow.days_after_due', { count: action.delayDays })
              : t('workflow.on_issue_date')}
          </span>
          <span className="text-gray-400">·</span>
          <Link
            to={`/${companySlug}/invoices/${invoice.id}`}
            className="text-blue-600 hover:underline"
          >
            {invoice.number}
          </Link>
          <span className="ml-auto text-xs font-medium">
            {fmt.format(invoice.outstanding)}
          </span>
        </div>
      </div>

      {/* Email compose area (shown for email channel) */}
      {action.channel === 'email' && template && (
        <div className="flex-1 px-6 py-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {t('actions.email_preview')}
          </h3>

          {/* From */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-12">{t('actions.from')}</span>
            <span className="text-sm text-gray-700">
              {action.senderName ?? user?.name ?? '—'}{user?.email ? ` — ${user.email}` : ''}
            </span>
          </div>

          {/* Subject */}
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 w-12 pt-0.5">{t('actions.subject')}</span>
            <span className="text-sm text-gray-700 font-medium">{template.subject}</span>
          </div>

          {/* Body */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white min-h-32">
            <pre className="text-sm text-gray-700 font-sans whitespace-pre-wrap">{template.body}</pre>
          </div>
        </div>
      )}

      {/* Call / Letter placeholder */}
      {action.channel !== 'email' && (
        <div className="flex-1 px-6 py-4">
          <div className="border border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400">
            <div className="flex justify-center mb-2">{CHANNEL_ICON[action.channel]}</div>
            <p className="text-sm">{t(`actions.channel.${action.channel}`)}</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            onClick={handlePause}
            disabled={pausing}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t('actions.pause')}
          </button>
          <button
            onClick={handleIgnore}
            disabled={ignoring}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {t('actions.ignore')}
          </button>
        </div>
        {action.channel === 'email' && (
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {sending ? t('common.loading') : t('actions.send')}
          </button>
        )}
      </div>
    </div>
  )
}
