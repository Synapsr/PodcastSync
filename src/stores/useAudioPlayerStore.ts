import { create } from 'zustand'
import { convertFileSrc } from '@tauri-apps/api/tauri'
import type { Episode } from '../types/episode'

interface AudioPlayerStore {
  currentEpisode: Episode | null
  isPlaying: boolean
  currentTime: number
  duration: number
  audioElement: HTMLAudioElement | null

  play: (episode: Episode, useLocalFile: boolean) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setAudioElement: (element: HTMLAudioElement) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  reset: () => void
}

export const useAudioPlayerStore = create<AudioPlayerStore>((set, get) => ({
  currentEpisode: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  audioElement: null,

  play: (episode, useLocalFile) => {
    const { audioElement } = get()

    if (!audioElement) {
      console.error('Audio element not initialized')
      return
    }

    const audioUrl = useLocalFile && episode.download_path
      ? convertFileSrc(episode.download_path)
      : episode.audio_url

    console.log('Playing audio:', {
      episode: episode.title,
      useLocalFile,
      audioUrl,
      downloadPath: episode.download_path
    })

    // Stop current playback if any
    audioElement.pause()
    audioElement.currentTime = 0

    // Set new source
    audioElement.src = audioUrl
    audioElement.load()

    // Play
    const playPromise = audioElement.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Audio playing successfully')
          set({
            currentEpisode: episode,
            isPlaying: true,
            currentTime: 0,
          })
        })
        .catch((error) => {
          console.error('Error playing audio:', error)
          set({ isPlaying: false })
        })
    } else {
      set({
        currentEpisode: episode,
        isPlaying: true,
        currentTime: 0,
      })
    }
  },

  pause: () => {
    const { audioElement } = get()
    if (audioElement) {
      audioElement.pause()
    }
    set({ isPlaying: false })
  },

  resume: () => {
    const { audioElement } = get()
    if (audioElement) {
      audioElement.play().catch((error) => {
        console.error('Error resuming audio:', error)
      })
    }
    set({ isPlaying: true })
  },

  seek: (time) => {
    const { audioElement } = get()
    if (audioElement) {
      audioElement.currentTime = time
    }
    set({ currentTime: time })
  },

  setAudioElement: (element) => {
    set({ audioElement: element })
  },

  setCurrentTime: (time) => {
    set({ currentTime: time })
  },

  setDuration: (duration) => {
    set({ duration })
  },

  reset: () => {
    const { audioElement } = get()
    if (audioElement) {
      audioElement.pause()
      audioElement.src = ''
    }
    set({
      currentEpisode: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    })
  },
}))
