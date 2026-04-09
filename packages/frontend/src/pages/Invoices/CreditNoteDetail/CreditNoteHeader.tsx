import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'

interface CreditNoteHeaderProps {
  number: string
}

export default function CreditNoteHeader({ number }: CreditNoteHeaderProps) {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()

  return (
    <div className="flex items-center gap-3 mb-6 flex-shrink-0">
      <Link
        to={`/${companySlug}/invoices`}
        className="text-sm text-gray-500 hover:underline"
      >
        {t('invoice.tab_credit_notes')}
      </Link>
      <span className="text-gray-300">/</span>
      <span className="text-sm font-semibold text-gray-900">
        {t('credit_note.credit_note_number', { number })}
      </span>
    </div>
  )
}
