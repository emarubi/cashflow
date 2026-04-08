import { useTranslation } from 'react-i18next'

interface Contact {
  email: string
  firstName: string
  lastName: string
  isMain: boolean
}

interface ContactsTabProps {
  contacts: Contact[]
}

export default function ContactsTab({ contacts }: ContactsTabProps) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{t('customer.tab_contacts')}</h3>
        <div className="flex items-center gap-2">
          <button className="text-xs text-blue-600 hover:underline">{t('customer.view_all_contacts')}</button>
          <button className="px-2 py-1 text-xs border border-gray-200 rounded text-gray-600 hover:bg-gray-50">
            + {t('customer.contacts_add')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">{t('customer.contact_email')}</th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">{t('customer.contact_first_name')}</th>
              <th className="px-2 py-2 text-xs font-medium text-gray-500 uppercase">{t('customer.contact_last_name')}</th>
              <th className="w-16" />
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-400 text-xs">{t('customer.no_contacts')}</td>
              </tr>
            )}
            {contacts.map((c, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-2 py-2.5 text-xs text-gray-800">
                  <div className="flex items-center gap-2">
                    {c.email}
                    {c.isMain && (
                      <span className="px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                        {t('customer.contacts_main')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2.5 text-xs text-gray-700">{c.firstName}</td>
                <td className="px-2 py-2.5 text-xs text-gray-700">{c.lastName}</td>
                <td className="px-2 py-2.5">
                  <div className="flex items-center gap-1.5 justify-end">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-red-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contacts.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">{contacts.length} contacts</p>
      )}
    </div>
  )
}
