import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr from './locales/fr.json'
import en from './locales/en.json'

i18n.use(initReactI18next).init({
  lng: localStorage.getItem('cashflow_lang') ?? 'fr',
  fallbackLng: 'fr',
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
