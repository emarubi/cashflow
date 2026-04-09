import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { useCreditNote } from '@/hooks/useCreditNote'
import CreditNoteHeader from './CreditNoteHeader'
import CreditNoteInfoCard from './CreditNoteInfoCard'
import CustomFieldsCard from './CustomFieldsCard'
import AppliedInvoicesCard from './AppliedInvoicesCard'
import RefundsCard from './RefundsCard'

export default function CreditNoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { creditNote, loading, error } = useCreditNote(id ?? '')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  if (error || !creditNote) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-500">
        {t('common.error')}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-screen-xl mx-auto flex flex-col h-full overflow-hidden">
      <CreditNoteHeader number={creditNote.number} />

      {/* Two-column body */}
      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Left sidebar */}
        <div className="w-2/5 flex-shrink-0 overflow-y-auto space-y-4">
          <CreditNoteInfoCard creditNote={creditNote} />
          <CustomFieldsCard />
        </div>

        {/* Right panel */}
        <div className="w-3/5 min-w-0 overflow-y-auto space-y-4">
          <AppliedInvoicesCard creditNote={creditNote} />
          <RefundsCard />
        </div>
      </div>
    </div>
  )
}
