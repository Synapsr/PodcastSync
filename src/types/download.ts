export interface DownloadProgressPayload {
  episode_id: number
  downloaded: number
  total: number | null
  progress: number
  speed: number | null
}

export interface DownloadCompletedPayload {
  episode_id: number
  file_path: string
}

export interface DownloadFailedPayload {
  episode_id: number
  error: string
}
