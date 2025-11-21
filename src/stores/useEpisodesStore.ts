import { create } from 'zustand'
import type { Episode, EpisodeStats } from '../types/episode'
import { episodeApi } from '../lib/api'

interface EpisodesStore {
  episodes: Episode[]
  stats: EpisodeStats | null
  isLoading: boolean
  error: string | null

  fetchEpisodes: () => Promise<void>
  fetchEpisodesBySubscription: (subscriptionId: number) => Promise<void>
  fetchEpisodesByStatus: (status: string) => Promise<void>
  fetchStats: () => Promise<void>
  retryEpisode: (id: number) => Promise<void>
  deleteEpisode: (id: number) => Promise<void>
  updateEpisodeProgress: (id: number, progress: number) => void
  markEpisodeCompleted: (id: number, filePath: string) => void
  markEpisodeFailed: (id: number, error: string) => void
}

export const useEpisodesStore = create<EpisodesStore>((set, get) => ({
  episodes: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchEpisodes: async () => {
    set({ isLoading: true, error: null })
    try {
      const episodes = await episodeApi.list()
      set({ episodes, isLoading: false })
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  fetchEpisodesBySubscription: async (subscriptionId) => {
    set({ isLoading: true, error: null })
    try {
      const episodes = await episodeApi.listBySubscription(subscriptionId)
      set({ episodes, isLoading: false })
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  fetchEpisodesByStatus: async (status) => {
    set({ isLoading: true, error: null })
    try {
      const episodes = await episodeApi.listByStatus(status)
      set({ episodes, isLoading: false })
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  fetchStats: async () => {
    try {
      const stats = await episodeApi.getStats()
      set({ stats })
    } catch (error) {
      set({ error: String(error) })
    }
  },

  retryEpisode: async (id) => {
    try {
      await episodeApi.retry(id)
      set((state) => ({
        episodes: state.episodes.map((e) =>
          e.id === id
            ? { ...e, download_status: 'pending' as const, download_error: null }
            : e
        ),
      }))
    } catch (error) {
      set({ error: String(error) })
      throw error
    }
  },

  deleteEpisode: async (id) => {
    try {
      await episodeApi.delete(id)
      set((state) => ({
        episodes: state.episodes.filter((e) => e.id !== id),
      }))
    } catch (error) {
      set({ error: String(error) })
      throw error
    }
  },

  updateEpisodeProgress: (id, progress) => {
    set((state) => ({
      episodes: state.episodes.map((e) =>
        e.id === id
          ? { ...e, download_progress: progress, download_status: 'downloading' as const }
          : e
      ),
    }))
  },

  markEpisodeCompleted: (id, filePath) => {
    set((state) => ({
      episodes: state.episodes.map((e) =>
        e.id === id
          ? {
              ...e,
              download_status: 'completed' as const,
              download_path: filePath,
              download_progress: 100,
            }
          : e
      ),
    }))
  },

  markEpisodeFailed: (id, error) => {
    set((state) => ({
      episodes: state.episodes.map((e) =>
        e.id === id
          ? {
              ...e,
              download_status: 'failed' as const,
              download_error: error,
            }
          : e
      ),
    }))
  },
}))
