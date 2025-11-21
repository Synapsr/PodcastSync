import { useEffect, useRef } from 'react'
import { useAudioPlayerStore } from '../stores/useAudioPlayerStore'
import { Button } from './ui/Button'
import { Play, Pause, X } from 'lucide-react'

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    setAudioElement,
    setCurrentTime,
    setDuration,
    pause,
    resume,
    seek,
    reset,
  } = useAudioPlayerStore()

  useEffect(() => {
    if (audioRef.current) {
      console.log('Audio element initialized')
      setAudioElement(audioRef.current)
    }
  }, [setAudioElement])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => pause()

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [setCurrentTime, setDuration, pause])

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <>
      <audio ref={audioRef} />
      {currentEpisode && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => (isPlaying ? pause() : resume())}
              className="flex-shrink-0"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentEpisode.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%, hsl(var(--secondary)) 100%)`,
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            <Button size="icon" variant="ghost" onClick={reset} className="flex-shrink-0">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        </div>
      )}
    </>
  )
}
