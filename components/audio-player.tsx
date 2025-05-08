"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatTime } from "@/lib/utils"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"

interface AudioPlayerProps {
  audioUrl: string
  onTimeUpdate?: (currentTime: number) => void
  onDurationChange?: (duration: number) => void
  onPlay?: () => void
  onPause?: () => void
  language: "ru" | "es"
  currentTime: number // Добавляем проп для внешнего управления временем
}

export function AudioPlayer({
  audioUrl,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  language,
  currentTime: externalTime, // Переименовываем для избежания конфликта
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const prevExternalTimeRef = useRef(externalTime)

  // Обработка изменения URL аудио
  useEffect(() => {
    if (!audioUrl) return

    const audio = audioRef.current
    if (!audio) return

    // Сбрасываем состояние
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setIsLoading(true)
    setError(null)

    // Загружаем новый аудиофайл
    audio.src = audioUrl
    audio.load()
  }, [audioUrl])

  // Обработка внешнего изменения времени
  useEffect(() => {
    if (externalTime !== prevExternalTimeRef.current) {
      const audio = audioRef.current
      if (audio) {
        audio.currentTime = externalTime
        setCurrentTime(externalTime)
      }
      prevExternalTimeRef.current = externalTime
    }
  }, [externalTime])

  // Обработчики событий аудио
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      onTimeUpdate?.(audio.currentTime)
    }

    const handleDurationChange = () => {
      setDuration(audio.duration)
      onDurationChange?.(audio.duration)
      setIsLoading(false)
    }

    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }

    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }

    const handleLoadedData = () => {
      setIsLoading(false)
    }

    const handleError = (e: ErrorEvent) => {
      console.error("Audio error:", e)
      setError(language === "ru" ? "Ошибка загрузки аудио" : "Error al cargar audio")
      setIsLoading(false)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("loadeddata", handleLoadedData)
    audio.addEventListener("error", handleError as EventListener)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("loadeddata", handleLoadedData)
      audio.removeEventListener("error", handleError as EventListener)
    }
  }, [onTimeUpdate, onDurationChange, onPlay, onPause, language])

  // Воспроизведение/пауза
  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error)
        setError(language === "ru" ? "Ошибка воспроизведения" : "Error de reproducción")
      })
    }
  }

  // Перемотка
  const seekTo = (time: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = time
    setCurrentTime(time)
    onTimeUpdate?.(time) // Добавляем вызов колбэка
  }

  // Обработка изменения слайдера
  const handleSliderChange = (value: number[]) => {
    seekTo(value[0])
  }

  // Перемотка вперед/назад
  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
    seekTo(newTime)
  }

  return (
    <div className="space-y-2">
      <audio ref={audioRef} preload="metadata" />

      {error && <div className="p-1 bg-destructive/10 text-destructive rounded-md text-xs">{error}</div>}

      <div>
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          disabled={isLoading || !audioUrl}
          className="mb-1"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip(-10)}
          disabled={isLoading || !audioUrl}
          title={language === "ru" ? "Назад 10 секунд" : "Retroceder 10 segundos"}
          className="h-8 w-8"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          className="h-10 w-10 rounded-full"
          onClick={togglePlayPause}
          disabled={isLoading || !audioUrl}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => skip(10)}
          disabled={isLoading || !audioUrl}
          title={language === "ru" ? "Вперед 10 секунд" : "Avanzar 10 segundos"}
          className="h-8 w-8"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
