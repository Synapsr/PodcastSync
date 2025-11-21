import { create } from 'zustand'
import type { Subscription, CreateSubscriptionData } from '../types/subscription'
import { subscriptionApi } from '../lib/api'

interface SubscriptionsStore {
  subscriptions: Subscription[]
  isLoading: boolean
  error: string | null

  fetchSubscriptions: () => Promise<void>
  createSubscription: (data: CreateSubscriptionData) => Promise<void>
  updateSubscription: (id: number, data: CreateSubscriptionData) => Promise<void>
  deleteSubscription: (id: number) => Promise<void>
  toggleSubscription: (id: number, enabled: boolean) => Promise<void>
  checkNow: (id: number) => Promise<void>
  incrementEpisodeCount: (id: number) => void
  incrementDownloadCount: (id: number) => void
  updateLastChecked: (id: number) => void
}

export const useSubscriptionsStore = create<SubscriptionsStore>((set) => ({
  subscriptions: [],
  isLoading: false,
  error: null,

  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null })
    try {
      const subscriptions = await subscriptionApi.list()
      set({ subscriptions, isLoading: false })
    } catch (error) {
      set({ error: String(error), isLoading: false })
    }
  },

  createSubscription: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const subscription = await subscriptionApi.create(data)
      set((state) => ({
        subscriptions: [...state.subscriptions, subscription],
        isLoading: false,
      }))
      // Immediately check the feed after creation
      await subscriptionApi.checkNow(subscription.id)
    } catch (error) {
      set({ error: String(error), isLoading: false })
      throw error
    }
  },

  updateSubscription: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await subscriptionApi.update(id, data)
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? updated : s)),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: String(error), isLoading: false })
      throw error
    }
  },

  deleteSubscription: async (id) => {
    try {
      await subscriptionApi.delete(id)
      set((state) => ({
        subscriptions: state.subscriptions.filter((s) => s.id !== id),
      }))
    } catch (error) {
      set({ error: String(error) })
      throw error
    }
  },

  toggleSubscription: async (id, enabled) => {
    try {
      await subscriptionApi.toggle(id, enabled)
      set((state) => ({
        subscriptions: state.subscriptions.map((s) => (s.id === id ? { ...s, enabled } : s)),
      }))
    } catch (error) {
      set({ error: String(error) })
      throw error
    }
  },

  checkNow: async (id) => {
    try {
      await subscriptionApi.checkNow(id)
    } catch (error) {
      set({ error: String(error) })
      throw error
    }
  },

  incrementEpisodeCount: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, total_episodes_found: s.total_episodes_found + 1 } : s
      ),
    }))
  },

  incrementDownloadCount: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, total_downloads: s.total_downloads + 1 } : s
      ),
    }))
  },

  updateLastChecked: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, last_checked_at: new Date().toISOString() } : s
      ),
    }))
  },
}))
