import { useState, useEffect } from 'react'
import { X, Download, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { Button } from './ui/Button'
import { updaterApi } from '../lib/api'
import { useTranslation } from '../i18n/LanguageContext'
import type { UpdateInfo } from '../types/update'

interface UpdateModalProps {
  onClose: () => void
}

export function UpdateModal({ onClose }: UpdateModalProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)

  useEffect(() => {
    checkForUpdates()
  }, [])

  const checkForUpdates = async () => {
    setLoading(true)
    setError(null)
    try {
      const info = await updaterApi.checkUpdates()
      setUpdateInfo(info)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (updateInfo?.release_url) {
      window.open(updateInfo.release_url, '_blank')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{t('checkForUpdates')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-muted-foreground">{t('checkingForUpdates')}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-500">{t('errorCheckingUpdates')}</p>
                <p className="text-sm text-red-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && updateInfo && (
            <>
              {updateInfo.update_available ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-primary/10 border border-primary/20 rounded-md">
                    <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {t('updateAvailable')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('updateAvailableMessage').replace('{version}', updateInfo.latest_version)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">{t('currentVersion')}</p>
                      <p className="text-lg font-semibold text-foreground">{updateInfo.current_version}</p>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-md border border-primary/20">
                      <p className="text-xs text-muted-foreground mb-1">{t('latestVersion')}</p>
                      <p className="text-lg font-semibold text-primary">{updateInfo.latest_version}</p>
                    </div>
                  </div>

                  {updateInfo.release_notes && (
                    <div>
                      <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        {t('releaseNotes')}
                      </h3>
                      <div className="p-4 bg-muted/30 rounded-md max-h-60 overflow-y-auto">
                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                          {updateInfo.release_notes}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleDownload} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      {t('downloadUpdate')}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      {t('close')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <CheckCircle className="h-12 w-12 text-primary" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-foreground">{t('noUpdateAvailable')}</p>
                    <p className="text-sm text-muted-foreground mt-1">{t('upToDate')}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t('currentVersion')}: <span className="font-mono">{updateInfo.current_version}</span>
                    </p>
                  </div>
                  <Button variant="outline" onClick={onClose} className="mt-4">
                    {t('close')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
