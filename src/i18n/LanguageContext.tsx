import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { fr, TranslationKey } from './fr'
import { en } from './en'
import { br } from './br'
import { formatRelativeTime, getDateLocale } from '../lib/utils'

type Language = 'fr' | 'en' | 'br'
type Translations = typeof fr

const translations: Record<Language, Translations> = {
  fr,
  en,
  br,
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'podcast-sync-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load language from localStorage or default to French
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return (saved as Language) || 'fr'
  })

  useEffect(() => {
    // Save language to localStorage whenever it changes
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key]
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider')
  }
  return context
}

// Hook to get a formatRelativeTime function that uses the current language
export function useFormatRelativeTime() {
  const { language, t } = useTranslation()

  return (date: string | null): string => {
    const locale = getDateLocale(language)
    return formatRelativeTime(date, locale, t('never'), t('unknown'))
  }
}
