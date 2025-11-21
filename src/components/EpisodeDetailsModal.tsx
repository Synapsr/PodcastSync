import { useState, useEffect } from 'react'
import { X, ExternalLink } from 'lucide-react'
import type { Episode } from '../types/episode'
import { formatBytes, formatDuration } from '../lib/utils'
import { episodeApi, type AvailableMedia } from '../lib/api'
import { useTranslation } from '../i18n/LanguageContext'

interface EpisodeDetailsModalProps {
  episode: Episode
  onClose: () => void
}

export function EpisodeDetailsModal({ episode, onClose }: EpisodeDetailsModalProps) {
  const { t } = useTranslation()
  const [availableMedia, setAvailableMedia] = useState<AvailableMedia | null>(null)
  const [loadingMedia, setLoadingMedia] = useState(true)

  useEffect(() => {
    const fetchAvailableMedia = async () => {
      try {
        const media = await episodeApi.getAvailableMedia(episode.subscription_id, episode.guid)
        setAvailableMedia(media)
      } catch (error) {
        console.error('Failed to fetch available media:', error)
      } finally {
        setLoadingMedia(false)
      }
    }

    fetchAvailableMedia()
  }, [episode.subscription_id, episode.guid])
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'downloading':
        return 'text-blue-500'
      case 'failed':
        return 'text-red-500'
      case 'pending':
        return 'text-yellow-500'
      case 'paused':
        return 'text-orange-500'
      case 'skipped':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t('downloaded')
      case 'downloading':
        return t('downloading')
      case 'failed':
        return t('failed')
      case 'pending':
        return t('pending')
      case 'paused':
        return t('paused')
      case 'skipped':
        return t('pending')
      default:
        return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-card border border-border rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-foreground">{episode.title}</h2>
            {episode.program_name && (
              <p className="text-sm text-muted-foreground mt-1">{episode.program_name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image */}
          {episode.image_url && (
            <div className="flex justify-center">
              <img
                src={episode.image_url}
                alt={episode.title}
                className="w-48 h-48 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Description */}
          {episode.description && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">{t('description')}</h3>
              <div
                className="text-sm text-muted-foreground prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: episode.description }}
              />
            </div>
          )}

          {/* General Information */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">{t('generalInfo')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label={t('status')} value={getStatusLabel(episode.download_status)} valueClassName={getStatusColor(episode.download_status)} />
              <InfoItem label={t('publicationDate')} value={formatDate(episode.pub_date)} />
              <InfoItem label={t('duration')} value={episode.duration_seconds ? formatDuration(episode.duration_seconds) : t('na')} />
              <InfoItem label={t('size')} value={episode.audio_size_bytes ? formatBytes(episode.audio_size_bytes) : t('na')} />
              <InfoItem label={t('audioType')} value={episode.audio_type || t('na')} />
              <InfoItem label={t('attempts')} value={episode.download_attempts.toString()} />
            </div>
          </div>

          {/* Download Information */}
          {(episode.download_status === 'downloading' || episode.download_status === 'completed') && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">{t('downloadInfo')}</h3>
              <div className="grid grid-cols-2 gap-4">
                {episode.download_progress > 0 && (
                  <InfoItem label={t('progress')} value={`${Math.round(episode.download_progress)}%`} />
                )}
                {episode.download_started_at && (
                  <InfoItem label={t('started')} value={formatDate(episode.download_started_at)} />
                )}
                {episode.download_completed_at && (
                  <InfoItem label={t('completed')} value={formatDate(episode.download_completed_at)} />
                )}
                {episode.download_path && (
                  <div className="col-span-2">
                    <InfoItem label={t('path')} value={episode.download_path} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Information */}
          {episode.download_error && (
            <div>
              <h3 className="text-sm font-medium text-red-500 mb-2">{t('error')}</h3>
              <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md">
                {episode.download_error}
              </p>
            </div>
          )}

          {/* Technical Information */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">{t('technicalInfo')}</h3>
            <div className="grid grid-cols-1 gap-3">
              <InfoItem label="GUID" value={episode.guid} mono />
              <InfoItem label="URL audio" value={episode.audio_url} mono />
              <InfoItem label={t('discoveredOn')} value={formatDate(episode.discovered_at)} />
            </div>
          </div>

          {/* Available Media Versions */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">{t('availableVersions')}</h3>
            {loadingMedia ? (
              <p className="text-sm text-muted-foreground">{t('loading')}</p>
            ) : availableMedia ? (
              <div className="space-y-2">
                {availableMedia.original_url && (
                  <MediaVersionItem
                    label={t('formatOriginal')}
                    url={availableMedia.original_url}
                    description={t('qualityMaximum')}
                  />
                )}
                {availableMedia.flac_url && (
                  <MediaVersionItem
                    label={t('formatFlac')}
                    url={availableMedia.flac_url}
                    description={t('qualityHighNormalized')}
                  />
                )}
                {availableMedia.mp3_url && (
                  <MediaVersionItem
                    label={t('formatMp3')}
                    url={availableMedia.mp3_url}
                    description={t('qualityStandardReduced')}
                  />
                )}
                {availableMedia.standard_url &&
                 !availableMedia.original_url &&
                 !availableMedia.flac_url &&
                 !availableMedia.mp3_url && (
                  <MediaVersionItem
                    label={t('formatStandard')}
                    url={availableMedia.standard_url}
                    description={t('qualityDefault')}
                  />
                )}
                {!availableMedia.standard_url &&
                 !availableMedia.original_url &&
                 !availableMedia.flac_url &&
                 !availableMedia.mp3_url && (
                  <p className="text-sm text-muted-foreground">{t('noAlternativeVersions')}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-400">{t('failedToLoadVersions')}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  )
}

interface MediaVersionItemProps {
  label: string
  url: string
  description: string
}

function MediaVersionItem({ label, url, description }: MediaVersionItemProps) {
  const { t } = useTranslation()
  const handleOpenUrl = () => {
    window.open(url, '_blank')
  }

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        onClick={handleOpenUrl}
        className="ml-4 p-2 hover:bg-muted rounded-md transition-colors"
        title={t('openUrl')}
      >
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )
}

interface InfoItemProps {
  label: string
  value: string
  valueClassName?: string
  mono?: boolean
}

function InfoItem({ label, value, valueClassName, mono }: InfoItemProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm ${valueClassName || 'text-foreground'} ${mono ? 'font-mono break-all' : ''}`}>
        {value}
      </p>
    </div>
  )
}
