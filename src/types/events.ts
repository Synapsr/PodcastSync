import type { Episode } from './episode'

export interface EpisodeDiscoveredPayload {
  subscription_id: number
  episode: Episode
}

export interface SubscriptionCheckedPayload {
  subscription_id: number
  new_episodes_count: number
  error: string | null
}
