import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAllActionEvents, AllActionEvent } from '@/hooks/useAllActionEvents'
import { useAuth } from '@/contexts/AuthContext'

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const RESULT_BADGE: Record<string, string> = {
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  skipped: 'bg-gray-100 text-gray-600',
  cancelled_paid: 'bg-blue-100 text-blue-700',
}

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

function triggerGroupLabel(trigger: string, t: (k: string) => string): string {
  switch (trigger) {
    case 'on_issue': return t('workflow.section_issued')
    case 'before_due': return t('actions.group_before_due')
    case 'after_due': return t('workflow.section_due')
    default: return trigger
  }
}

function ActionEventRow({ event, companySlug, t }: { event: AllActionEvent; companySlug: string; t: (k: string, opts?: Record<string, unknown>) => string }) {
  const action = event.action
  const invoice = event.execution?.invoice

  const delayLabel = action
    ? action.trigger === 'before_due'
      ? t('workflow.days_before_due', { count: action.delayDays })
      : action.trigger === 'after_due'
      ? t('workflow.days_after_due', { count: action.delayDays })
      : t('workflow.on_issue_date')
    : '—'

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-gray-400">{CHANNEL_ICON[action?.channel ?? 'email']}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {action?.workflow?.name ?? '—'} · {action?.template?.name ?? '—'}
            </p>
            <p className="text-xs text-gray-500">{delayLabel}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {invoice?.debtor ? (
          <Link to={`/${companySlug}/customers/${invoice.debtor.id}`} className="text-sm text-blue-600 hover:underline">
            {invoice.debtor.name}
          </Link>
        ) : <span className="text-sm text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3">
        {invoice ? (
          <Link to={`/${companySlug}/invoices/${invoice.id}`} className="text-sm text-blue-600 hover:underline">
            {invoice.number}
          </Link>
        ) : <span className="text-sm text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-700">
        {invoice ? fmt.format(invoice.outstanding) : '—'}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${RESULT_BADGE[event.result] ?? 'bg-gray-100 text-gray-600'}`}>
          {t(`actions.result.${event.result}`)}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-400">
        {new Date(event.triggeredAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
      </td>
    </tr>
  )
}

// Group events by trigger type and sort groups: on_issue → before_due → after_due
function groupByTrigger(events: AllActionEvent[]) {
  const order = ['on_issue', 'before_due', 'after_due']
  const grouped = new Map<string, AllActionEvent[]>()

  for (const event of events) {
    const trigger = event.action?.trigger ?? 'after_due'
    if (!grouped.has(trigger)) grouped.set(trigger, [])
    grouped.get(trigger)!.push(event)
  }

  return order.filter((k) => grouped.has(k)).map((k) => ({ trigger: k, events: grouped.get(k)! }))
}

export default function AllView() {
  const { t } = useTranslation()
  const { company } = useAuth()
  const companySlug = company?.slug ?? ''

  const { events, totalCount, from, to, hasNextPage, hasPrevPage, nextPage, prevPage, loading, error } = useAllActionEvents()

  const groups = groupByTrigger(events)

  if (loading && events.length === 0) {
    return <div className="p-8 text-sm text-gray-400">{t('common.loading')}</div>
  }
  if (error) {
    return <div className="p-8 text-sm text-red-400">{t('common.error')}</div>
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-white rounded-lg border border-gray-200 shadow">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('actions.col_action')}</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('customers.col_customer')}</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('actions.col_invoice')}</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('customers.col_outstanding')}</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('actions.col_result')}</th>
            <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{t('actions.col_date')}</th>
          </tr>
        </thead>
        <tbody>
          {groups.map(({ trigger, events: groupEvents }) => (
            <>
              <tr key={`group-${trigger}`} className="bg-gray-50 border-y border-gray-200">
                <td colSpan={6} className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  {triggerGroupLabel(trigger, t)}
                </td>
              </tr>
              {groupEvents.map((event) => (
                <ActionEventRow key={event.id} event={event} companySlug={companySlug} t={t} />
              ))}
            </>
          ))}
          {events.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">{t('actions.no_events')}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600 mt-auto">
        <span>{t('customers.pagination', { from, to, total: totalCount })}</span>
        <div className="flex gap-2">
          <button
            onClick={prevPage}
            disabled={!hasPrevPage}
            className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ←
          </button>
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}
