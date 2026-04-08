import { useTranslation } from 'react-i18next'
import CustomerRow, { DebtorItem } from './CustomerRow'

interface CustomersTableProps {
  debtors: DebtorItem[]
}

export default function CustomersTable({ debtors }: CustomersTableProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t('customers.col_customer')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-20">
              {t('customers.col_rating')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t('customers.col_user')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t('customers.col_workflow')}
            </th>
            <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
              {t('customers.col_outstanding')}
            </th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {debtors.map((d) => (
            <CustomerRow key={d.id} debtor={d} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
