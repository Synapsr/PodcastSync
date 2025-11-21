import { useEffect, useState } from 'react'
import { X, Download, ExternalLink } from 'lucide-react'
import { listen } from '@tauri-apps/api/event'
import { Button } from './ui/Button'
import { useTranslation } from '../i18n/LanguageContext'
import type { UpdateInfo } from '../types/update'

export function UpdateNotification() {
  const { t } = useTranslation()
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Listen for update-available events from backend
    const unlisten = listen<UpdateInfo>('update-available', (event) => {
      setUpdateInfo(event.payload)
      setVisible(true)
    })

    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])

  const handleDownload = () => {
    if (updateInfo?.release_url) {
      window.open(updateInfo.release_url, '_blank')
    }
    setVisible(false)
  }

  const handleDismiss = () => {
    setVisible(false)
  }

  if (!visible || !updateInfo) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 duration-300">
      <div className="bg-card border-2 border-primary/50 rounded-lg shadow-2xl p-4 max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-primary/10 rounded-full">
            <Download className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {t('updateAvailable')}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {t('updateAvailableMessage').replace('{version}', updateInfo.latest_version)}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleDownload}
                className="h-8 text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {t('downloadUpdate')}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 text-xs"
              >
                {t('close')}
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
