import { useTranslation } from 'react-i18next'

const CHANNEL_ICONS: Record<string, string> = {
  email:  '✉',
  call:   '📞',
  letter: '📄',
}

const RESULT_STYLES: Record<string, string> = {
  sent:           'text-green-600 bg-green-50',
  failed:         'text-red-600 bg-red-50',
  skipped:        'text-gray-500 bg-gray-100',
  cancelled_paid: 'text-blue-600 bg-blue-50',
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

interface ActionEvent {
  id: string
  triggeredAt: string
  result: string
  error: string | null
  metadata: unknown
  action: { id: string; channel: string; stepOrder: number }
}

interface InvoiceTimelineCardProps {
  actionEvents: ActionEvent[]
}

export default function InvoiceTimelineCard({ actionEvents }: InvoiceTimelineCardProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{t('invoice.timeline')}</h3>
        <div className="flex items-center gap-2">
          <button className="text-xs text-gray-500 hover:text-gray-700">
            {t('invoice.timeline_summarize')}
          </button>
          <button className="text-xs text-blue-600 hover:underline">
            + {t('invoice.timeline_add_note')}
          </button>
        </div>
      </div>

      {actionEvents.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">{t('invoice.no_timeline')}</p>
      )}

      <div className="space-y-4">
        {[...actionEvents].reverse().map((event) => {
          const meta = event.metadata as Record<string, string> | null
          return (
            <div key={event.id} className="flex gap-3">
              {/* Icon */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                {CHANNEL_ICONS[event.action.channel] ?? '•'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {event.action.channel}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${RESULT_STYLES[event.result] ?? 'text-gray-500 bg-gray-100'}`}
                  >
                    {event.result.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                    {formatDateTime(event.triggeredAt)}
                  </span>
                </div>

                {meta?.subject && (
                  <p className="text-xs font-medium text-gray-800 truncate">{meta.subject}</p>
                )}
                {meta?.body && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{meta.body}</p>
                )}
                {event.error && (
                  <p className="text-xs text-red-500 mt-0.5">{event.error}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
