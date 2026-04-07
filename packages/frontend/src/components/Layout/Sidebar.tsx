import { NavLink, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'

interface NavItem {
  key: string
  path: string
  label: string
  icon: React.ReactNode
}

function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function IconWorkflow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconDocument() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconLightning() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function IconCreditCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function IconBank() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export default function Sidebar() {
  const { t } = useTranslation()
  const { companySlug } = useParams<{ companySlug: string }>()
  const { user, logout } = useAuth()

  const slug = companySlug ?? ''

  const navItems: NavItem[] = [
    { key: 'dashboard', path: `/${slug}/dashboard`, label: t('nav.dashboard'), icon: <IconDashboard /> },
    { key: 'workflows', path: `/${slug}/workflows`, label: t('nav.workflows'), icon: <IconWorkflow /> },
    { key: 'customers', path: `/${slug}/customers`, label: t('nav.customers'), icon: <IconUsers /> },
    { key: 'invoices', path: `/${slug}/invoices`, label: t('nav.invoices'), icon: <IconDocument /> },
    { key: 'actions', path: `/${slug}/actions`, label: t('nav.actions'), icon: <IconLightning /> },
    { key: 'payments', path: `/${slug}/payments`, label: t('nav.payments'), icon: <IconCreditCard /> },
    { key: 'bank', path: `/${slug}/bank`, label: t('nav.bank'), icon: <IconBank /> },
  ]

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <aside className="flex flex-col w-14 min-h-screen bg-sidebar flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-sidebar-active flex items-center justify-center">
          <span className="text-white font-bold text-sm">C</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center py-3 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              [
                'relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
                isActive
                  ? 'text-white bg-sidebar-active/20 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-sidebar-active before:-translate-x-2 before:rounded-full'
                  : 'text-sidebar-icon hover:text-white hover:bg-sidebar-hover',
              ].join(' ')
            }
          >
            {item.icon}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: settings + avatar */}
      <div className="flex flex-col items-center pb-4 gap-3">
        <button
          title={t('nav.settings')}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-sidebar-icon hover:text-white hover:bg-sidebar-hover transition-colors"
        >
          <IconSettings />
        </button>

        <button
          onClick={logout}
          title={t('auth.logout')}
          className="w-8 h-8 rounded-full bg-sidebar-active flex items-center justify-center text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          {initials}
        </button>
      </div>
    </aside>
  )
}
