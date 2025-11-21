import { useEffect, useState } from 'react'
import { Button } from './components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/Card'
import { Input } from './components/ui/Input'
import { useSubscriptionsStore } from './stores/useSubscriptionsStore'
import { useEpisodesStore } from './stores/useEpisodesStore'
import { useAudioPlayerStore } from './stores/useAudioPlayerStore'
import { formatBytes } from './lib/utils'
import { listen } from '@tauri-apps/api/event'
import type { DownloadStartedPayload, DownloadProgressPayload, DownloadCompletedPayload, DownloadFailedPayload } from './types/download'
import type { EpisodeDiscoveredPayload, SubscriptionCheckedPayload } from './types/events'
import type { Subscription } from './types/subscription'
import { Plus, RefreshCw, Trash2, FolderOpen, Pencil, ArrowLeft, Download, CheckCircle, Clock, XCircle, Play, MoreVertical, FolderIcon, Pause, Info } from 'lucide-react'
import { fsApi, subscriptionApi, episodeApi } from './lib/api'
import type { Episode } from './types/episode'
import { AudioPlayer } from './components/AudioPlayer'
import { DropdownMenu, DropdownMenuItem } from './components/ui/DropdownMenu'
import { Toggle } from './components/ui/Toggle'
import { Tooltip } from './components/ui/Tooltip'
import { Footer } from './components/Footer'
import { UpdateNotification } from './components/UpdateNotification'
import { EpisodeDetailsModal } from './components/EpisodeDetailsModal'
import { useTranslation, useFormatRelativeTime } from './i18n/LanguageContext'
import { LanguageSelector } from './components/LanguageSelector'
import logoImage from './assets/lumyradio-logo.png'

function App() {
  const { t } = useTranslation()
  const formatRelativeTime = useFormatRelativeTime()
  const {
    subscriptions,
    isLoading: subsLoading,
    fetchSubscriptions,
    toggleSubscription,
    deleteSubscription,
    checkNow,
    incrementEpisodeCount,
    incrementDownloadCount,
    updateLastChecked,
  } = useSubscriptionsStore()

  const { episodes, fetchEpisodes, addEpisode, updateEpisodeProgress, markEpisodeCompleted, markEpisodeFailed } = useEpisodesStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null)
  const [episodeDetails, setEpisodeDetails] = useState<Episode | null>(null)

  useEffect(() => {
    fetchSubscriptions()
    fetchEpisodes()

    // Process pending episodes on startup to trigger downloads
    episodeApi.processPending().catch((error) => {
      console.error('Error processing pending episodes:', error)
    })

    // Listen for download events
    const unsubscribeStarted = listen<DownloadStartedPayload>('download-started', (event) => {
      // Mark episode as downloading in the UI
      updateEpisodeProgress(event.payload.episode_id, 0)
    })

    const unsubscribeProgress = listen<DownloadProgressPayload>('download-progress', (event) => {
      updateEpisodeProgress(event.payload.episode_id, event.payload.progress)
    })

    const unsubscribeCompleted = listen<DownloadCompletedPayload>('download-completed', (event) => {
      markEpisodeCompleted(event.payload.episode_id, event.payload.file_path)
      // Use subscription_id from payload (no stale closure)
      incrementDownloadCount(event.payload.subscription_id)
    })

    const unsubscribeFailed = listen<DownloadFailedPayload>('download-failed', (event) => {
      markEpisodeFailed(event.payload.episode_id, event.payload.error)
    })

    // Listen for episode discovered events
    const unsubscribeDiscovered = listen<EpisodeDiscoveredPayload>('episode-discovered', (event) => {
      // Add the discovered episode to the episodes store in real-time
      addEpisode(event.payload.episode)
      // Increment the episode count for the subscription
      incrementEpisodeCount(event.payload.subscription_id)
    })

    // Listen for subscription checked events
    const unsubscribeChecked = listen<SubscriptionCheckedPayload>('subscription-checked', (event) => {
      updateLastChecked(event.payload.subscription_id)
    })

    return () => {
      unsubscribeStarted.then((fn) => fn())
      unsubscribeProgress.then((fn) => fn())
      unsubscribeCompleted.then((fn) => fn())
      unsubscribeFailed.then((fn) => fn())
      unsubscribeDiscovered.then((fn) => fn())
      unsubscribeChecked.then((fn) => fn())
    }
  }, [])

  const activeDownloads = episodes.filter((e) => e.download_status === 'downloading')

  const handleManualRefresh = async (subscriptionId: number) => {
    try {
      // Verify files first
      await episodeApi.verifySubscriptionFiles(subscriptionId)

      // Check the feed for new episodes
      await checkNow(subscriptionId)

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Trigger downloads for all pending episodes
      await episodeApi.processPending()

      // Refresh data
      await fetchSubscriptions()
      await fetchEpisodes()
    } catch (error) {
      console.error('Error during manual refresh:', error)
    }
  }

  // If a subscription is selected, show its details
  if (selectedSubscriptionId) {
    const subscription = subscriptions.find((s) => s.id === selectedSubscriptionId)
    if (subscription) {
      return (
        <>
          <SubscriptionDetail
            subscription={subscription}
            onBack={() => setSelectedSubscriptionId(null)}
            onRefresh={() => {
              fetchSubscriptions()
              fetchEpisodes()
            }}
            onShowEpisodeDetails={(episode) => setEpisodeDetails(episode)}
          />
          {episodeDetails && (
            <EpisodeDetailsModal episode={episodeDetails} onClose={() => setEpisodeDetails(null)} />
          )}
        </>
      )
    }
  }

  return (
    <>
      <UpdateNotification />
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 max-w-6xl">
          <header className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={logoImage}
                    alt="Logo"
                    className="h-10 w-auto"
                  />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    {t('appTitle')}
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  {t('appDescription')}
                </p>
              </div>
              <LanguageSelector />
            </div>
          </header>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="border-none shadow-lg bg-gradient-to-br from-card to-secondary">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground/80">{t('subscriptions')}</CardDescription>
              <CardTitle className="text-4xl font-bold">{subscriptions.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-card to-secondary">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground/80">{t('episodes')}</CardDescription>
              <CardTitle className="text-4xl font-bold">{episodes.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-card to-blue-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground/80">{t('downloading')}</CardDescription>
              <CardTitle className="text-4xl font-bold text-blue-400">{activeDownloads.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-none shadow-lg bg-gradient-to-br from-card to-purple-950/20">
            <CardHeader className="pb-2">
              <CardDescription className="text-muted-foreground/80">{t('completed')}</CardDescription>
              <CardTitle className="text-4xl font-bold text-primary">
                {episodes.filter((e) => e.download_status === 'completed').length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Active Downloads */}
        {activeDownloads.length > 0 && (
          <Card className="mb-8 border-none shadow-lg bg-gradient-to-br from-card to-blue-950/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-400 animate-pulse" />
                <CardTitle>{t('activeDownloads')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeDownloads.map((episode) => (
                  <div key={episode.id}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium truncate pr-4">{episode.title}</span>
                      <span className="text-sm text-primary font-bold flex-shrink-0">
                        {episode.download_progress}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary to-purple-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${episode.download_progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscriptions */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">{t('yourPodcasts')}</CardTitle>
                <CardDescription>{t('managePodcastsDescription')}</CardDescription>
              </div>
              <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                {t('addSubscription')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subsLoading ? (
              <p>{t('loading')}</p>
            ) : subscriptions.length === 0 ? (
              <p className="text-muted-foreground">
                {t('noSubscriptions')} {t('noSubscriptionsDescription')}
              </p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <Card
                    key={sub.id}
                    className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg border-border/50 bg-card/50 backdrop-blur"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-4">
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => setSelectedSubscriptionId(sub.id)}
                        >
                          <CardTitle className="text-lg font-semibold mb-1">{sub.name}</CardTitle>
                          <CardDescription className="text-xs truncate mb-2">
                            {sub.rss_url}
                          </CardDescription>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(sub.last_checked_at)}
                            </span>
                            <span>•</span>
                            <span className="font-medium">{sub.total_episodes_found} {t('totalEpisodes')}</span>
                            <span>•</span>
                            <span className="text-primary font-medium">{sub.total_downloads} {t('totalDownloads')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Tooltip content={t('tooltipEdit')}>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingSubscription(sub)
                              }}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Tooltip>

                          <Tooltip content={t('tooltipCheckNewEpisodes')}>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleManualRefresh(sub.id)
                              }}
                              className="h-8 w-8"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </Tooltip>

                          <Tooltip content={sub.enabled ? t('tooltipEnabled') : t('tooltipDisabled')}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSubscription(sub.id, !sub.enabled)
                              }}
                            >
                              <Toggle enabled={sub.enabled} onChange={() => {}} />
                            </div>
                          </Tooltip>

                          <Tooltip content={t('tooltipDelete')}>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteSubscription(sub.id)
                              }}
                              className="h-8 w-8 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simple Add Form */}
        {showAddForm && (
          <AddSubscriptionForm onClose={() => setShowAddForm(false)} />
        )}

        {/* Edit Form */}
        {editingSubscription && (
          <EditSubscriptionForm
            subscription={editingSubscription}
            onClose={() => setEditingSubscription(null)}
          />
        )}
        </div>
      </div>
      <AudioPlayer />
      <Footer />
    </>
  )
}

function AddSubscriptionForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const { createSubscription, subscriptions } = useSubscriptionsStore()
  const [name, setName] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [outputDir, setOutputDir] = useState('')
  const [checkFrequency, setCheckFrequency] = useState(15)
  const [quality, setQuality] = useState<'enclosure' | 'original' | 'flac' | 'mp3'>('enclosure')
  const [maxEpisodes, setMaxEpisodes] = useState<number | null>(15)
  const [filenameFormat, setFilenameFormat] = useState('{show} - {episode}')
  const [isFetchingTitle, setIsFetchingTitle] = useState(false)

  // Pre-fill output directory from last subscription
  useEffect(() => {
    if (subscriptions.length > 0 && !outputDir) {
      const lastSubscription = subscriptions[subscriptions.length - 1]
      setOutputDir(lastSubscription.output_directory)
    }
  }, [subscriptions])

  // Auto-fetch RSS title when URL is entered (with debouncing)
  useEffect(() => {
    if (!rssUrl || rssUrl.length < 10) return

    const timer = setTimeout(async () => {
      if (!name) { // Only auto-fill if name is empty
        setIsFetchingTitle(true)
        try {
          const title = await subscriptionApi.fetchRssTitle(rssUrl)
          setName(title)
        } catch (error) {
          console.error('Failed to fetch RSS title:', error)
        } finally {
          setIsFetchingTitle(false)
        }
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [rssUrl, name])

  const handleSelectDirectory = async () => {
    try {
      const path = await fsApi.selectDirectory()
      if (path) {
        setOutputDir(path)
      }
    } catch (error) {
      alert(`${t('errorSelectingDirectory')}: ${error}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSubscription({
        name,
        rss_url: rssUrl,
        output_directory: outputDir,
        check_frequency_minutes: checkFrequency,
        max_items_to_check: 100,
        preferred_quality: quality,
        max_episodes: maxEpisodes,
        filename_format: filenameFormat,
      })
      onClose()
    } catch (error) {
      alert(`${t('errorCreatingSubscription')}: ${error}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{t('addSubscription')}</CardTitle>
          <CardDescription>{t('addSubscriptionDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('rssUrl')}</label>
              <Input
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                placeholder={t('rssUrlPlaceholder')}
                type="url"
                required
              />
              {isFetchingTitle && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fetching RSS title...
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">{t('subscriptionName')}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('subscriptionNamePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('outputDirectory')}</label>
              <div className="flex gap-2">
                <Input
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder={t('outputDirectoryPlaceholder')}
                  required
                  readOnly
                  className="flex-1"
                />
                <Button type="button" onClick={handleSelectDirectory} size="icon">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t('checkFrequency')}</label>
              <select
                value={checkFrequency}
                onChange={(e) => setCheckFrequency(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value={5}>{t('frequency5min')}</option>
                <option value={15}>{t('frequency15min')}</option>
                <option value={30}>{t('frequency30min')}</option>
                <option value={60}>{t('frequency1hour')}</option>
                <option value={120}>{t('frequency2hours')}</option>
                <option value={360}>{t('frequency6hours')}</option>
                <option value={720}>{t('frequency12hours')}</option>
                <option value={1440}>{t('frequency24hours')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('audioQuality')}</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="enclosure">{t('audioQualityEnclosure')}</option>
                <option value="original">{t('audioQualityOriginal')}</option>
                <option value="flac">{t('audioQualityFlac')}</option>
                <option value="mp3">{t('audioQualityMp3')}</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {t('audioQualityDescription')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">{t('maxEpisodes')}</label>
              <Input
                type="number"
                value={maxEpisodes ?? ''}
                onChange={(e) => setMaxEpisodes(e.target.value ? Number(e.target.value) : null)}
                placeholder={t('maxEpisodesPlaceholder')}
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('maxEpisodesDescription')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">{t('filenameFormat')}</label>
              <select
                value={filenameFormat}
                onChange={(e) => setFilenameFormat(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="{show} - {episode}">{t('filenameFormatShowEpisode')}</option>
                <option value="{episode}">{t('filenameFormatEpisodeOnly')}</option>
                <option value="{episode} - {show}">{t('filenameFormatEpisodeShow')}</option>
                <option value="{date}_{episode}">{t('filenameFormatDateEpisode')}</option>
              </select>
              <Input
                value={filenameFormat}
                onChange={(e) => setFilenameFormat(e.target.value)}
                placeholder={t('filenameFormatCustomPlaceholder')}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('filenameFormatDescription')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {t('create')}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function EditSubscriptionForm({
  subscription,
  onClose
}: {
  subscription: Subscription
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { updateSubscription } = useSubscriptionsStore()
  const [name, setName] = useState(subscription.name)
  const [rssUrl, setRssUrl] = useState(subscription.rss_url)
  const [outputDir, setOutputDir] = useState(subscription.output_directory)
  const [checkFrequency, setCheckFrequency] = useState(subscription.check_frequency_minutes)
  const [quality, setQuality] = useState<'enclosure' | 'original' | 'flac' | 'mp3'>(subscription.preferred_quality)
  const [maxEpisodes, setMaxEpisodes] = useState<number | null>(subscription.max_episodes)
  const [filenameFormat, setFilenameFormat] = useState(subscription.filename_format)

  const handleSelectDirectory = async () => {
    try {
      const path = await fsApi.selectDirectory()
      if (path) {
        setOutputDir(path)
      }
    } catch (error) {
      alert(`${t('errorSelectingDirectory')}: ${error}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateSubscription(subscription.id, {
        name,
        rss_url: rssUrl,
        output_directory: outputDir,
        check_frequency_minutes: checkFrequency,
        max_items_to_check: subscription.max_items_to_check,
        preferred_quality: quality,
        max_episodes: maxEpisodes,
        filename_format: filenameFormat,
      })
      onClose()
    } catch (error) {
      alert(`${t('errorCreatingSubscription')}: ${error}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{t('editSubscription')}</CardTitle>
          <CardDescription>{t('editSubscriptionDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('subscriptionName')}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('subscriptionNamePlaceholder')}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('rssUrl')}</label>
              <Input
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                placeholder={t('rssUrlPlaceholder')}
                type="url"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t('outputDirectory')}</label>
              <div className="flex gap-2">
                <Input
                  value={outputDir}
                  onChange={(e) => setOutputDir(e.target.value)}
                  placeholder={t('outputDirectoryPlaceholder')}
                  required
                  readOnly
                  className="flex-1"
                />
                <Button type="button" onClick={handleSelectDirectory} size="icon">
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{t('checkFrequency')}</label>
              <select
                value={checkFrequency}
                onChange={(e) => setCheckFrequency(Number(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value={5}>{t('frequency5min')}</option>
                <option value={15}>{t('frequency15min')}</option>
                <option value={30}>{t('frequency30min')}</option>
                <option value={60}>{t('frequency1hour')}</option>
                <option value={120}>{t('frequency2hours')}</option>
                <option value={360}>{t('frequency6hours')}</option>
                <option value={720}>{t('frequency12hours')}</option>
                <option value={1440}>{t('frequency24hours')}</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">{t('audioQuality')}</label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="enclosure">{t('audioQualityEnclosure')}</option>
                <option value="original">{t('audioQualityOriginal')}</option>
                <option value="flac">{t('audioQualityFlac')}</option>
                <option value="mp3">{t('audioQualityMp3')}</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {t('audioQualityDescription')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">{t('maxEpisodes')}</label>
              <Input
                type="number"
                value={maxEpisodes ?? ''}
                onChange={(e) => setMaxEpisodes(e.target.value ? Number(e.target.value) : null)}
                placeholder={t('maxEpisodesPlaceholder')}
                min="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('maxEpisodesDescription')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">{t('filenameFormat')}</label>
              <select
                value={filenameFormat}
                onChange={(e) => setFilenameFormat(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="{show} - {episode}">{t('filenameFormatShowEpisode')}</option>
                <option value="{episode}">{t('filenameFormatEpisodeOnly')}</option>
                <option value="{episode} - {show}">{t('filenameFormatEpisodeShow')}</option>
                <option value="{date}_{episode}">{t('filenameFormatDateEpisode')}</option>
              </select>
              <Input
                value={filenameFormat}
                onChange={(e) => setFilenameFormat(e.target.value)}
                placeholder={t('filenameFormatCustomPlaceholder')}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('filenameFormatDescription')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {t('saveChanges')}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                {t('cancel')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function SubscriptionDetail({
  subscription,
  onBack,
  onRefresh,
  onShowEpisodeDetails,
}: {
  subscription: Subscription
  onBack: () => void
  onRefresh: () => void
  onShowEpisodeDetails: (episode: Episode) => void
}) {
  const { t } = useTranslation()
  const formatRelativeTime = useFormatRelativeTime()
  const { play, pause, resume, currentEpisode, isPlaying } = useAudioPlayerStore()
  const [subscriptionEpisodes, setSubscriptionEpisodes] = useState<Episode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRerunning, setIsRerunning] = useState(false)

  const loadEpisodes = async (skipVerify = false) => {
    setIsLoading(true)
    try {
      // Verify file existence before loading
      if (!skipVerify) {
        await episodeApi.verifySubscriptionFiles(subscription.id)
      }

      const episodes = await episodeApi.listBySubscription(subscription.id)
      setSubscriptionEpisodes(episodes)
    } catch (error) {
      alert(`${t('errorLoadingEpisodes')}: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEpisodes()

    // Periodic file verification (every 15 seconds when active)
    const verifyInterval = setInterval(async () => {
      try {
        const invalidEpisodes = await episodeApi.verifySubscriptionFiles(subscription.id)
        if (invalidEpisodes.length > 0) {
          // Reload episodes if any were invalid
          await loadEpisodes(true) // Skip verify since we just did it
        }
      } catch (error) {
        console.error('Error verifying files:', error)
      }
    }, 15000)

    // Listen for download events
    const unsubscribeProgress = listen<DownloadProgressPayload>('download-progress', (event) => {
      // Update the episode progress and status in the local state
      setSubscriptionEpisodes((prev) =>
        prev.map((ep) =>
          ep.id === event.payload.episode_id
            ? {
                ...ep,
                download_progress: event.payload.progress,
                download_status: 'downloading'
              }
            : ep
        )
      )
    })

    const unsubscribeCompleted = listen<DownloadCompletedPayload>('download-completed', (event) => {
      // Update episode status to completed
      setSubscriptionEpisodes((prev) =>
        prev.map((ep) =>
          ep.id === event.payload.episode_id
            ? {
                ...ep,
                download_status: 'completed',
                download_progress: 100,
                download_path: event.payload.file_path
              }
            : ep
        )
      )
    })

    const unsubscribeFailed = listen<DownloadFailedPayload>('download-failed', (event) => {
      // Update episode status to failed
      setSubscriptionEpisodes((prev) =>
        prev.map((ep) =>
          ep.id === event.payload.episode_id
            ? {
                ...ep,
                download_status: 'failed',
                download_error: event.payload.error
              }
            : ep
        )
      )
    })

    return () => {
      clearInterval(verifyInterval)
      unsubscribeProgress.then((fn) => fn())
      unsubscribeCompleted.then((fn) => fn())
      unsubscribeFailed.then((fn) => fn())
    }
  }, [subscription.id])

  const handleRerun = async () => {
    setIsRerunning(true)
    try {
      // Verify files first
      await episodeApi.verifySubscriptionFiles(subscription.id)

      // Check the feed for new episodes
      await subscriptionApi.checkNow(subscription.id)

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Trigger downloads for all pending episodes
      await episodeApi.processPending()

      // Reload episodes
      await loadEpisodes(true) // Skip verify since we just did it
      onRefresh()
    } catch (error) {
      alert(`${t('errorDuringRerun')}: ${error}`)
    } finally {
      setIsRerunning(false)
    }
  }

  const handleRetryEpisode = async (episodeId: number) => {
    try {
      await episodeApi.retry(episodeId)
      await loadEpisodes()
      onRefresh()
    } catch (error) {
      alert(`${t('errorRetryingEpisode')}: ${error}`)
    }
  }

  const handleOpenLocation = async (episode: Episode) => {
    if (episode.download_path) {
      try {
        await fsApi.openInFileManager(episode.download_path)
      } catch (error) {
        alert(`${t('errorOpeningLocation')}: ${error}`)
      }
    }
  }

  const handlePlayEpisode = (episode: Episode) => {
    const isCurrentEpisode = currentEpisode?.id === episode.id

    if (isCurrentEpisode && isPlaying) {
      // Pause current episode
      pause()
    } else if (isCurrentEpisode && !isPlaying) {
      // Resume paused episode
      resume()
    } else {
      // Play new episode
      play(episode, episode.download_status === 'completed')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-primary" />
      case 'downloading':
        return <Download className="h-5 w-5 text-blue-600 animate-pulse" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'paused':
        return <Pause className="h-5 w-5 text-orange-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t('downloaded')
      case 'downloading':
        return t('downloading')
      case 'pending':
        return t('queued')
      case 'failed':
        return t('failed')
      case 'paused':
        return t('paused')
      default:
        return status
    }
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('backToDashboard')}
            </Button>

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  {subscription.name}
                </h1>
                <p className="text-muted-foreground mb-4 text-sm">{subscription.rss_url}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(subscription.last_checked_at)}
                  </span>
                  <span>•</span>
                  <span className="font-medium">{subscription.total_episodes_found} {t('totalEpisodes')}</span>
                  <span>•</span>
                  <span className="text-primary font-medium">{subscription.total_downloads} {t('totalDownloads')}</span>
                </div>
              </div>
              <Button
                onClick={handleRerun}
                disabled={isRerunning}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <RefreshCw className={`h-4 w-4 ${isRerunning ? 'animate-spin' : ''}`} />
                {isRerunning ? t('running') : t('rerun')}
              </Button>
            </div>
          </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">{t('episodes')}</CardTitle>
            <CardDescription>
              {subscriptionEpisodes.length === 0
                ? t('noEpisodesFound')
                : `${subscriptionEpisodes.length} ${t('episodesCount')}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">{t('loadingEpisodes')}</p>
            ) : subscriptionEpisodes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {t('noEpisodesFound')} {t('noEpisodesFoundDescription')}
              </p>
            ) : (
              <div className="space-y-2">
                {subscriptionEpisodes.map((episode) => {
                  const isCurrentlyPlaying = currentEpisode?.id === episode.id && isPlaying
                  const isCurrentEpisode = currentEpisode?.id === episode.id

                  return (
                    <Card
                      key={episode.id}
                      className={`border-border/50 bg-card/50 backdrop-blur transition-all cursor-pointer hover:border-primary/30 ${
                        isCurrentEpisode ? 'border-primary/50 shadow-lg' : ''
                      }`}
                      onClick={() => onShowEpisodeDetails(episode)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Play Button */}
                          <Button
                            size="icon"
                            variant={isCurrentlyPlaying ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePlayEpisode(episode)
                            }}
                            className={`flex-shrink-0 h-12 w-12 rounded-full ${
                              isCurrentlyPlaying ? 'bg-primary hover:bg-primary/90' : ''
                            }`}
                          >
                            {isCurrentlyPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5" />
                            )}
                          </Button>

                          {/* Status Icon */}
                          <div className="flex-shrink-0">
                            {getStatusIcon(episode.download_status)}
                          </div>

                          {/* Episode Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-1 truncate">{episode.title}</h3>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                              <span className="text-muted-foreground">
                                {formatRelativeTime(episode.pub_date)}
                              </span>
                              {episode.audio_size_bytes && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-muted-foreground">
                                    {formatBytes(episode.audio_size_bytes)}
                                  </span>
                                </>
                              )}
                              <span className="text-muted-foreground">•</span>
                              <span
                                className={`font-medium ${
                                  episode.download_status === 'completed'
                                    ? 'text-primary'
                                    : episode.download_status === 'failed'
                                    ? 'text-destructive'
                                    : episode.download_status === 'downloading'
                                    ? 'text-blue-400'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {getStatusText(episode.download_status)}
                              </span>
                              {episode.download_progress > 0 &&
                                episode.download_status === 'downloading' && (
                                  <>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-blue-400 font-medium">
                                      {episode.download_progress}%
                                    </span>
                                  </>
                                )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {episode.download_status === 'failed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRetryEpisode(episode.id)
                                }}
                              >
                                {t('retry')}
                              </Button>
                            )}
                            <DropdownMenu
                              trigger={
                                <Button size="icon" variant="ghost" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              }
                            >
                              <DropdownMenuItem
                                onClick={() => onShowEpisodeDetails(episode)}
                                icon={<Info className="h-4 w-4" />}
                              >
                                {t('details')}
                              </DropdownMenuItem>
                              {episode.download_status === 'completed' && episode.download_path && (
                                <DropdownMenuItem
                                  onClick={() => handleOpenLocation(episode)}
                                  icon={<FolderIcon className="h-4 w-4" />}
                                >
                                  {t('openLocation')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
      <AudioPlayer />
      <Footer />
    </>
  )
}

export default App
