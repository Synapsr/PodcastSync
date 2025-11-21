import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import type { Locale } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function formatRelativeTime(date: string | null, locale: Locale = enUS, neverText = 'Never', unknownText = 'Unknown'): string {
  if (!date) return neverText
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale })
  } catch {
    return unknownText
  }
}

// Helper to get the correct locale based on language code
export function getDateLocale(languageCode: string): Locale {
  if (languageCode === 'fr' || languageCode === 'br') return fr
  return enUS
}

export function formatDateTime(date: string | null): string {
  if (!date) return 'Unknown'
  try {
    return format(new Date(date), 'PPpp')
  } catch {
    return 'Unknown'
  }
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`
}
