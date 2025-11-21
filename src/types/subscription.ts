export type QualityPreference = 'enclosure' | 'original' | 'flac' | 'mp3'

export interface Subscription {
  id: number
  name: string
  rss_url: string
  radio_slug: string | null
  automation_name: string | null
  check_frequency_minutes: number
  output_directory: string
  max_items_to_check: number
  enabled: boolean
  preferred_quality: QualityPreference
  max_episodes: number | null
  filename_format: string
  last_checked_at: string | null
  last_success_at: string | null
  last_error: string | null
  total_episodes_found: number
  total_downloads: number
  created_at: string
  updated_at: string
}

export interface CreateSubscriptionData {
  name: string
  rss_url: string
  radio_slug?: string | null
  automation_name?: string | null
  check_frequency_minutes: number
  output_directory: string
  max_items_to_check: number
  preferred_quality: QualityPreference
  max_episodes: number | null
  filename_format: string
}
