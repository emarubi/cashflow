import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import RatingBadge from './RatingBadge'

interface AssignedUser {
  id: string
  name: string
  role: string
}

interface WorkflowRef {
  id: string
  name: string
}

export interface DebtorItem {
  id: string
  name: string
  email: string | null
  rating: string | null
  hasPaymentMethod: boolean
  outstandingAmount: number
  assignedUser: AssignedUser | null
  workflow: WorkflowRef | null
}

interface CustomerRowProps {
  debtor: DebtorItem
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function CustomerRow({ debtor }: CustomerRowProps) {
  const { companySlug } = useParams<{ companySlug: string }>()
  const { t } = useTranslation()
  const slug = companySlug ?? ''

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Customer name */}
      <td className="px-4 py-3">
        <Link
          to={`/${slug}/customers/${debtor.id}`}
          className="text-sm font-medium text-gray-900 hover:text-blue-600"
        >
          {debtor.name}
        </Link>
      </td>

      {/* Rating */}
      <td className="px-4 py-3">
        <RatingBadge rating={debtor.rating} />
      </td>

      {/* Assigned user */}
      <td className="px-4 py-3">
        {debtor.assignedUser ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700 flex-shrink-0">
              {debtor.assignedUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-700">{debtor.assignedUser.name}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>

      {/* Workflow */}
      <td className="px-4 py-3">
        {debtor.workflow ? (
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm text-gray-700 truncate max-w-[160px]">{debtor.workflow.name}</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>

      {/* Outstanding amount */}
      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
        {formatCurrency(debtor.outstandingAmount)}
      </td>

      {/* Payment method indicator */}
      <td className="px-4 py-3 text-center">
        {debtor.hasPaymentMethod && (
          <svg className="w-4 h-4 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" />
          </svg>
        )}
      </td>
    </tr>
  )
}
