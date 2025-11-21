import { invoke } from '@tauri-apps/api/tauri'
import type { Subscription, CreateSubscriptionData } from '../types/subscription'
import type { Episode, EpisodeStats } from '../types/episode'
import type { UpdateInfo } from '../types/update'

export interface AvailableMedia {
  standard_url: string | null
  original_url: string | null
  flac_url: string | null
  mp3_url: string | null
}

// Subscription API
export const subscriptionApi = {
  list: () => invoke<Subscription[]>('list_subscriptions'),
  get: (id: number) => invoke<Subscription>('get_subscription', { id }),
  create: (data: CreateSubscriptionData) =>
    invoke<Subscription>('create_subscription', { data }),
  update: (id: number, data: CreateSubscriptionData) =>
    invoke<Subscription>('update_subscription', { id, data }),
  delete: (id: number) => invoke<void>('delete_subscription', { id }),
  toggle: (id: number, enabled: boolean) =>
    invoke<void>('toggle_subscription', { id, enabled }),
  checkNow: (id: number) => invoke<void>('check_subscription_now', { id }),
  fetchRssTitle: (url: string) => invoke<string>('fetch_rss_title', { url }),
}

// Episode API
export const episodeApi = {
  list: () => invoke<Episode[]>('list_episodes'),
  listBySubscription: (subscriptionId: number) =>
    invoke<Episode[]>('list_episodes_by_subscription', { subscriptionId }),
  listByStatus: (status: string) =>
    invoke<Episode[]>('list_episodes_by_status', { status }),
  get: (id: number) => invoke<Episode>('get_episode', { id }),
  retry: (id: number) => invoke<void>('retry_episode', { id }),
  delete: (id: number) => invoke<void>('delete_episode', { id }),
  getStats: () => invoke<EpisodeStats>('get_episode_stats'),
  verifyFile: (id: number) => invoke<boolean>('verify_episode_file', { id }),
  verifySubscriptionFiles: (subscriptionId: number) =>
    invoke<number[]>('verify_subscription_files', { subscriptionId }),
  processPending: () => invoke<number>('process_pending_episodes'),
  getAvailableMedia: (subscriptionId: number, guid: string) =>
    invoke<AvailableMedia>('get_episode_available_media', { subscriptionId, guid }),
}

// Settings API
export const settingsApi = {
  getAll: () => invoke<Array<{ key: string; value: string }>>('get_all_settings'),
  get: (key: string) => invoke<string | null>('get_setting', { key }),
  set: (key: string, value: string) => invoke<void>('set_setting', { key, value }),
}

// Download API
export const downloadApi = {
  getQueueSize: () => invoke<number>('get_queue_size'),
  clearQueue: () => invoke<void>('clear_queue'),
}

// File system API
export const fsApi = {
  selectDirectory: () => invoke<string | null>('select_directory'),
  openInFileManager: (path: string) => invoke<void>('open_in_file_manager', { path }),
}

// Updater API
export const updaterApi = {
  checkUpdates: () => invoke<UpdateInfo>('check_updates'),
}
