import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface AddCustomersMenuProps {
  onClose: () => void
}

export default function AddCustomersMenu({ onClose }: AddCustomersMenuProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const items = [
    { key: 'create', label: t('customers.create') },
    { key: 'import', label: t('customers.import') },
    { key: 'history', label: t('customers.import_history') },
  ]

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-20"
    >
      {items.map((item) => (
        <button
          key={item.key}
          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
          onClick={onClose}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
