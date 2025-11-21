import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import logoImage from '../assets/lumyradio-logo.png'
import { Button } from './ui/Button'
import { UpdateModal } from './UpdateModal'
import { useTranslation } from '../i18n/LanguageContext'

export function Footer() {
  const { t } = useTranslation()
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  const handleLogoClick = () => {
    window.open('https://lumyradio.fr', '_blank')
  }

  return (
    <>
      <footer className="w-full py-6 flex justify-center items-center gap-6">
        <button
          onClick={handleLogoClick}
          className="opacity-40 hover:opacity-70 transition-opacity duration-200 cursor-pointer"
          aria-label="Visit Lumy Radio"
        >
          <img
            src={logoImage}
            alt="Lumy Radio"
            className="h-5 w-auto brightness-0 invert"
          />
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowUpdateModal(true)}
          className="opacity-40 hover:opacity-70 transition-opacity"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('checkForUpdates')}
        </Button>
      </footer>

      {showUpdateModal && <UpdateModal onClose={() => setShowUpdateModal(false)} />}
    </>
  )
}
