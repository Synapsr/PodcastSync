export interface Episode {
  id: number
  subscription_id: number
  guid: string
  title: string
  description: string | null
  pub_date: string | null
  audio_url: string
  audio_type: string | null
  audio_size_bytes: number | null
  duration_seconds: number | null
  image_url: string | null
  program_name: string | null
  download_status: DownloadStatus
  download_path: string | null
  download_progress: number
  download_started_at: string | null
  download_completed_at: string | null
  download_error: string | null
  download_attempts: number
  discovered_at: string
}

export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed' | 'skipped'

export interface EpisodeStats {
  total: number
  pending: number
  downloading: number
  completed: number
  failed: number
}
