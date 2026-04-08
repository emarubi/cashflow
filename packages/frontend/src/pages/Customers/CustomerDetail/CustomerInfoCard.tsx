import { useTranslation } from 'react-i18next'
import RatingBadge from '../RatingBadge'

interface AssignedUser {
  id: string
  name: string
  role: string
}

interface WorkflowRef {
  id: string
  name: string
  isActive: boolean
}

interface CustomerInfoCardProps {
  debtor: {
    name: string
    rating: string | null
    outstandingAmount: number
    avgPaymentDelayDays: number | null
    lastContactedAt: string | null
    assignedUser: AssignedUser | null
    workflow: WorkflowRef | null
  }
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

export default function CustomerInfoCard({ debtor }: CustomerInfoCardProps) {
  const { t } = useTranslation()

  const delay = debtor.avgPaymentDelayDays
  const delayLabel =
    delay !== null && delay !== undefined
      ? `${delay > 0 ? '+' : ''}${delay} ${t('customer.days_late', { count: Math.abs(delay) }).replace(/\d+\s/, '')}`
      : '—'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Name + links */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-2">{debtor.name}</h2>
        <div className="flex flex-col gap-1">
          <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline text-left">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {t('customer.explore')}
          </button>
          <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline text-left">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {t('customer.preview_portal')}
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t('customer.outstanding')}</p>
          <p className="text-sm font-semibold text-gray-900 mt-0.5">
            {formatCurrency(debtor.outstandingAmount)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t('customers.col_rating')}</p>
          <div className="mt-0.5">
            <RatingBadge rating={debtor.rating} />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t('customer.avg_delay')}</p>
          <p className="text-sm text-gray-900 mt-0.5">{delayLabel}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{t('customer.last_contacted')}</p>
          <p className="text-sm text-gray-900 mt-0.5">{formatDate(debtor.lastContactedAt)}</p>
        </div>
      </div>

      {/* Assigned users */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('customer.assigned_users')}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {debtor.assignedUser ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
              {debtor.assignedUser.name}
              <button className="text-gray-400 hover:text-gray-600 leading-none">×</button>
            </span>
          ) : null}
          <button className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-gray-400 text-xs">
            +
          </button>
        </div>
      </div>

      {/* Workflow */}
      {debtor.workflow && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{t('customer.workflow')}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm text-gray-800 truncate">{debtor.workflow.name}</span>
            </div>
            <button className="flex-shrink-0 px-2 py-1 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
              {debtor.workflow.isActive ? t('customer.pause_workflow') : t('customer.resume_workflow')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
