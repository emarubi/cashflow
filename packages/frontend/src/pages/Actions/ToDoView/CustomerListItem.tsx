import { useTranslation } from 'react-i18next'
import { ActionToDoDebtor } from '@/hooks/useActionsToDoByDebtor'

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

interface Props {
  debtor: ActionToDoDebtor
  selected: boolean
  onClick: () => void
}

export default function CustomerListItem({ debtor, selected, onClick }: Props) {
  const { t } = useTranslation()
  const hasOverdue = debtor.overdueAmount > 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${selected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span
            className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${hasOverdue ? 'bg-red-400' : 'bg-orange-300'}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{debtor.name}</p>
            {debtor.workflow && (
              <p className="text-xs text-gray-500 truncate">{debtor.workflow.name}</p>
            )}
            {debtor.nextActionDate && (
              <p className="text-xs text-gray-400 mt-0.5">
                {t('actions.next_action')}:{' '}
                {new Date(debtor.nextActionDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-gray-900">{fmt.format(debtor.outstandingAmount)}</p>
          {hasOverdue && (
            <p className="text-xs text-red-500">{fmt.format(debtor.overdueAmount)} {t('actions.overdue')}</p>
          )}
        </div>
      </div>
    </button>
  )
}
