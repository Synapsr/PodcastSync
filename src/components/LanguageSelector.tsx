import { Globe } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'

export function LanguageSelector() {
  const { language, setLanguage, t } = useTranslation()

  const toggleLanguage = () => {
    setLanguage(language === 'fr' ? 'en' : 'fr')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
      title={t('language')}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{language.toUpperCase()}</span>
    </button>
  )
}
