import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import ToDoView from './ToDoView'
import AllView from './AllView'

type Tab = 'todo' | 'all'

export default function ActionsPage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('todo')

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-screen-xl mx-auto p-8">
      {/* Header with toggle */}
      <div className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{t('nav.actions')}</h1>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab('todo')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'todo'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('actions.tab_todo')}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('actions.tab_all')}
          </button>
        </div>
      </div>

      {/* View */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'todo' ? <ToDoView /> : <AllView />}
      </div>
    </div>
  )
}
