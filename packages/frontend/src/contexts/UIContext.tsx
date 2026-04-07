import React, { createContext, useContext, useState, useCallback } from 'react'
import i18n from '@/i18n'

type Language = 'fr' | 'en'

interface UIContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('cashflow_lang') as Language) ?? 'fr'
  )
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('cashflow_lang', lang)
    void i18n.changeLanguage(lang)
    setLanguageState(lang)
  }, [])

  return (
    <UIContext.Provider value={{ language, setLanguage, sidebarOpen, setSidebarOpen }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used within UIProvider')
  return ctx
}
