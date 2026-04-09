import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActionToDoDebtor } from '@/hooks/useActionsToDoByDebtor'
import CustomerList from './CustomerList'
import ActionDetailPanel from './ActionDetailPanel'

export default function ToDoView() {
  const { t } = useTranslation()
  const [selectedDebtor, setSelectedDebtor] = useState<ActionToDoDebtor | null>(null)

  return (
    <div className="flex h-full overflow-hidden bg-white rounded-lg border border-gray-200 shadow">
      {/* Left panel — customer list */}
      <div className="w-80 flex-shrink-0 flex flex-col overflow-hidden">
        <CustomerList
          selectedId={selectedDebtor?.id ?? null}
          onSelect={setSelectedDebtor}
        />
      </div>

      {/* Right panel — action detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedDebtor ? (
          <ActionDetailPanel key={selectedDebtor.id} debtorId={selectedDebtor.id} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <svg className="mx-auto w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-gray-400">{t('actions.select_customer')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
