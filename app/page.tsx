"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  BookmarkPlus,
  Edit,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import { formatTime, parseTimeString } from "@/lib/utils"
import type { TranscriptSegment, PodcastMark, PodcastEpisode } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PodcastPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [marks, setMarks] = useState<PodcastMark[]>([])
  const [markTitle, setMarkTitle] = useState("")
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null)
  const [editingMarkTime, setEditingMarkTime] = useState<string>("")
  const [editingTranscriptId, setEditingTranscriptId] = useState<string | null>(null)
  const [editingTranscriptText, setEditingTranscriptText] = useState<string>("")
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([])
  const [filteredEpisodes, setFilteredEpisodes] = useState<PodcastEpisode[]>([])
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [collapsedPanels, setCollapsedPanels] = useState({
    episodes: false,
    marks: false,
    transcript: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [channelId, setChannelId] = useState<string>("meditationdosmundos")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  // Добавьте новое состояние для информации о канале
  const [channelInfo, setChannelInfo] = useState<{
    title: string
    username: string
    description: string
    photoUrl: string | null
  } | null>(null)

  // Initialize Telegram Mini App
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-web-app.js"
    script.async = true
    script.onload = () => {
      if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready()
        window.Telegram.WebApp.expand()

        // Get channel ID from Telegram Mini App params
        const webApp = window.Telegram.WebApp
        const startParam = webApp.initDataUnsafe?.start_param

        // If we have a start parameter, use it as channel ID
        // Otherwise use the Dos Mundos meditation channel
        if (startParam) {
          setChannelId(startParam)
        } else {
          // Use the Dos Mundos meditation channel ID
          setChannelId("meditationdosmundos")
        }

        setIsInitialized(true)
      }
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Load podcast data from Telegram channel
  useEffect(() => {
    if (!isInitialized || !channelId) return

    fetchEpisodesFromTelegramChannel()
  }, [isInitialized, channelId])

  // Fetch episodes from Telegram channel
  const fetchEpisodesFromTelegramChannel = async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      // Call our API endpoint to get episodes from the channel
      const response = await fetch(`/api/telegram?channelId=${channelId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch episodes: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        setErrorMessage(data.error)
        console.warn("API returned error:", data.error)
      }

      // Save channel info if available
      if (data.channelInfo) {
        setChannelInfo(data.channelInfo)
      }

      // Process episodes
      if (data.episodes && data.episodes.length > 0) {
        const fetchedEpisodes = data.episodes.map((episode: any, index: number) => ({
          id: episode.id || `episode-${index}`,
          title: episode.title || `Медитация ${index + 1}`,
          audioUrl: episode.audioUrl,
          duration: episode.duration || 180,
          date: episode.date || new Date().toISOString(),
          // Group by seasons (10 episodes per season)
          season: Math.floor(index / 10) + 1,
        }))

        setEpisodes(fetchedEpisodes)
        setFilteredEpisodes(fetchedEpisodes)

        if (fetchedEpisodes.length > 0) {
          setCurrentEpisodeId(fetchedEpisodes[0].id)
          loadEpisode(fetchedEpisodes[0])
        }

        toast({
          title: "Эпизоды загружены",
          description: `Загружено ${fetchedEpisodes.length} эпизодов из канала ${data.channelInfo?.title || channelId}`,
        })
      } else {
        throw new Error("No episodes found in the response")
      }
    } catch (error) {
      console.error("Error fetching episodes:", error)
      setErrorMessage(`Ошибка загрузки эпизодов: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`)

      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить эпизоды из канала. Используются тестовые данные.",
        variant: "destructive",
      })

      // Load mock data for testing
      loadMockData()
    } finally {
      setIsLoading(false)
    }
  }

  // Load mock data for testing
  const loadMockData = () => {
    const meditationTitles = [
      "Медитация для глубокого расслабления",
      "Медитация осознанности",
      "Медитация для сна",
      "Утренняя медитация",
      "Медитация для снятия стресса",
      "Медитация благодарности",
      "Медитация для концентрации",
      "Медитация для начинающих",
      "Медитация для гармонии",
      "Медитация для позитивного мышления",
    ]

    const mockEpisodes: PodcastEpisode[] = Array.from({ length: 10 }, (_, i) => ({
      id: `dos-mundos-${i + 1}`,
      title: meditationTitles[i],
      audioUrl: [
        "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
        "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg",
        "https://commondatastorage.googleapis.com/codeskulptor-assets/Evillaugh.ogg",
      ][i % 3],
      duration: 180 + i * 30,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      season: Math.floor(i / 10) + 1,
    }))

    setEpisodes(mockEpisodes)
    setFilteredEpisodes(mockEpisodes)
    setCurrentEpisodeId(mockEpisodes[0].id)
    loadEpisode(mockEpisodes[0])

    // Set channel info for mock data
    setChannelInfo({
      title: "Dos Mundos Медитации",
      username: "meditationdosmundos",
      description: "Канал с медитациями для гармонии и расслабления",
      photoUrl: null,
    })
  }

  // Load episode data and fetch transcription
  const loadEpisode = async (episode: PodcastEpisode) => {
    const audio = audioRef.current
    if (!audio) return

    // Reset player state
    audio.src = episode.audioUrl
    audio.load()
    setCurrentTime(0)
    setDuration(episode.duration)
    setIsPlaying(false)
    setActiveSegmentId(null)

    try {
      // Fetch transcription for this episode
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioUrl: episode.audioUrl,
          episodeId: episode.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch transcription")
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setTranscript(data.segments)

      // Fetch marks for this episode (in a real app, this would be a separate API call)
      // For now, we'll use mock data
      const mockMarks: PodcastMark[] = [
        {
          id: `${episode.id}-mark-1`,
          title: "Начало медитации",
          time: 0,
        },
        {
          id: `${episode.id}-mark-2`,
          title: "Глубокое дыхание",
          time: Math.floor(episode.duration * 0.2),
        },
        {
          id: `${episode.id}-mark-3`,
          title: "Визуализация",
          time: Math.floor(episode.duration * 0.5),
        },
        {
          id: `${episode.id}-mark-4`,
          title: "Расслабление",
          time: Math.floor(episode.duration * 0.7),
        },
        {
          id: `${episode.id}-mark-5`,
          title: "Завершение",
          time: Math.floor(episode.duration * 0.9),
        },
      ]

      setMarks(mockMarks)
    } catch (error) {
      console.error("Error loading episode data:", error)

      // Use mock data if API fails
      const mockTranscript: TranscriptSegment[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${episode.id}-segment-${i + 1}`,
        text: `Это часть транскрипции для эпизода "${episode.title}", сегмент ${i + 1}.`,
        start: i * (episode.duration / 20),
        end: (i + 1) * (episode.duration / 20),
      }))

      setTranscript(mockTranscript)

      const mockMarks: PodcastMark[] = [
        {
          id: `${episode.id}-mark-1`,
          title: "Начало медитации",
          time: 0,
        },
        {
          id: `${episode.id}-mark-2`,
          title: "Глубокое дыхание",
          time: Math.floor(episode.duration * 0.2),
        },
        {
          id: `${episode.id}-mark-3`,
          title: "Визуализация",
          time: Math.floor(episode.duration * 0.5),
        },
      ]

      setMarks(mockMarks)
    }
  }

  // Filter episodes based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredEpisodes(episodes)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = episodes.filter((episode) => episode.title.toLowerCase().includes(query))
      setFilteredEpisodes(filtered)
    }
  }, [searchQuery, episodes])

  // Handle episode selection
  const selectEpisode = (episodeId: string) => {
    const episode = episodes.find((ep) => ep.id === episodeId)
    if (episode) {
      setCurrentEpisodeId(episodeId)
      loadEpisode(episode)
    }
  }

  // Toggle panel collapse state
  const togglePanel = (panel: keyof typeof collapsedPanels) => {
    setCollapsedPanels((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }))
  }

  // Update current time
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)

      // Find active transcript segment
      const activeSegment = transcript.find(
        (segment) => audio.currentTime >= segment.start && audio.currentTime <= segment.end,
      )

      if (activeSegment) {
        setActiveSegmentId(activeSegment.id)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
    }
  }, [transcript])

  // Play/pause control
  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error)
        toast({
          title: "Ошибка воспроизведения",
          description: "Не удалось воспроизвести аудио. Проверьте URL файла.",
          variant: "destructive",
        })
      })
    }
    setIsPlaying(!isPlaying)
  }

  // Seek to time
  const seekTo = (time: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = time
    setCurrentTime(time)
  }

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    seekTo(value[0])
  }

  // Skip forward/backward
  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
    seekTo(newTime)
  }

  // Add a new mark at current time
  const addMark = () => {
    if (!markTitle.trim()) return

    const newMark: PodcastMark = {
      id: `mark-${Date.now()}`,
      title: markTitle,
      time: currentTime,
    }

    setMarks([...marks, newMark].sort((a, b) => a.time - b.time))
    setMarkTitle("")

    toast({
      title: "Метка добавлена",
      description: `Метка "${markTitle}" добавлена в ${formatTime(currentTime)}`,
    })
  }

  // Delete a mark
  const deleteMark = (markId: string) => {
    const markToDelete = marks.find((mark) => mark.id === markId)
    setMarks(marks.filter((mark) => mark.id !== markId))

    if (markToDelete) {
      toast({
        title: "Метка удалена",
        description: `Метка "${markToDelete.title}" удалена`,
      })
    }
  }

  // Start editing a mark's time
  const startEditingMark = (mark: PodcastMark) => {
    setEditingMarkId(mark.id)
    setEditingMarkTime(formatTime(mark.time))
  }

  // Save edited mark time
  const saveEditedMarkTime = () => {
    if (!editingMarkId) return

    const seconds = parseTimeString(editingMarkTime)
    if (seconds === null) {
      toast({
        title: "Ошибка формата времени",
        description: "Используйте формат MM:SS или HH:MM:SS",
        variant: "destructive",
      })
      return
    }

    // Update the mark
    const updatedMarks = marks
      .map((mark) => (mark.id === editingMarkId ? { ...mark, time: seconds } : mark))
      .sort((a, b) => a.time - b.time)

    setMarks(updatedMarks)

    // Reset editing state
    setEditingMarkId(null)
    setEditingMarkTime("")

    toast({
      title: "Метка обновлена",
      description: `Время метки изменено на ${formatTime(seconds)}`,
    })
  }

  // Cancel editing mark time
  const cancelEditingMark = () => {
    setEditingMarkId(null)
    setEditingMarkTime("")
  }

  // Start editing transcript text
  const startEditingTranscript = (segment: TranscriptSegment) => {
    setEditingTranscriptId(segment.id)
    setEditingTranscriptText(segment.text)
  }

  // Save edited transcript text
  const saveEditedTranscript = () => {
    if (!editingTranscriptId || !editingTranscriptText.trim()) return

    setTranscript(
      transcript.map((segment) =>
        segment.id === editingTranscriptId ? { ...segment, text: editingTranscriptText } : segment,
      ),
    )

    setEditingTranscriptId(null)
    setEditingTranscriptText("")

    toast({
      title: "Транскрипция обновлена",
      description: "Текст транскрипции успешно изменен",
    })
  }

  // Cancel editing transcript
  const cancelEditingTranscript = () => {
    setEditingTranscriptId(null)
    setEditingTranscriptText("")
  }

  // Navigate to a transcript segment
  const navigateToSegment = (segment: TranscriptSegment) => {
    seekTo(segment.start)
  }

  // Navigate to a mark
  const navigateToMark = (mark: PodcastMark) => {
    seekTo(mark.time)
  }

  // Group episodes by season
  const episodesBySeason = episodes.reduce(
    (acc, episode) => {
      const season = episode.season || 1
      if (!acc[season]) {
        acc[season] = []
      }
      acc[season].push(episode)
      return acc
    },
    {} as Record<number, PodcastEpisode[]>,
  )

  // Get current episode
  const currentEpisode = episodes.find((ep) => ep.id === currentEpisodeId)

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto p-2 space-y-3">
      {/* Audio element */}
      <audio
        ref={audioRef}
        preload="metadata"
        onError={(e) => {
          console.error("Audio error:", e)
          toast({
            title: "Ошибка аудио",
            description: "Не удалось загрузить аудиофайл. Проверьте URL или подключение к интернету.",
            variant: "destructive",
          })
        }}
      />

      {/* Error message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ошибка</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Channel info */}
      {channelInfo && (
        <Card className="p-3">
          <div className="flex items-center space-x-3">
            {channelInfo.photoUrl && (
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={channelInfo.photoUrl || "/placeholder.svg"}
                  alt={channelInfo.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{channelInfo.title}</h1>
              <p className="text-sm text-muted-foreground">@{channelInfo.username}</p>
            </div>
          </div>
          {channelInfo.description && <p className="mt-2 text-sm">{channelInfo.description}</p>}
        </Card>
      )}

      {/* Player controls */}
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold line-clamp-1">{currentEpisode?.title || "Загрузка..."}</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchEpisodesFromTelegramChannel}
            disabled={isLoading}
            title="Обновить список эпизодов"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSliderChange}
            className="mb-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => skip(-10)} title="Назад 10 секунд">
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button variant="default" size="icon" className="h-12 w-12 rounded-full" onClick={togglePlayPause}>
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={() => skip(10)} title="Вперед 10 секунд">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {/* Episodes panel */}
      <Card className="p-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel("episodes")}>
          <h3 className="text-lg font-semibold">Эпизоды</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {collapsedPanels.episodes ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsedPanels.episodes && (
          <div className="mt-2">
            <div className="relative mb-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск эпизодов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Tabs defaultValue="1">
              <TabsList className="w-full mb-2 overflow-x-auto flex-nowrap">
                {Object.keys(episodesBySeason).map((season) => (
                  <TabsTrigger key={season} value={season} className="flex-shrink-0">
                    Сезон {season}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.entries(episodesBySeason).map(([season, seasonEpisodes]) => (
                <TabsContent key={season} value={season} className="m-0">
                  <div className="grid gap-1 max-h-48 overflow-y-auto">
                    {seasonEpisodes
                      .filter((ep) => filteredEpisodes.some((fep) => fep.id === ep.id))
                      .map((episode) => (
                        <div
                          key={episode.id}
                          className={`p-2 rounded-md cursor-pointer ${
                            currentEpisodeId === episode.id ? "bg-primary/10" : "hover:bg-accent"
                          }`}
                          onClick={() => selectEpisode(episode.id)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-medium line-clamp-1">{episode.title}</div>
                            <div className="text-xs text-muted-foreground">{formatTime(episode.duration)}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </Card>

      {/* Add mark section */}
      <Card className="p-3">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Название метки"
            value={markTitle}
            onChange={(e) => setMarkTitle(e.target.value)}
            className="flex-1"
          />
          <Button variant="outline" onClick={addMark} className="flex items-center space-x-1">
            <BookmarkPlus className="h-4 w-4" />
            <span>Добавить</span>
          </Button>
        </div>
      </Card>

      {/* Marks panel */}
      <Card className="p-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel("marks")}>
          <h3 className="text-lg font-semibold">Метки</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {collapsedPanels.marks ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsedPanels.marks && (
          <div className="mt-2 flex flex-wrap gap-2">
            {marks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет меток. Добавьте метки для быстрой навигации.</p>
            ) : (
              marks.map((mark) => (
                <div key={mark.id} className="relative">
                  {editingMarkId === mark.id ? (
                    <div className="flex items-center space-x-1 border rounded-md p-1">
                      <Input
                        value={editingMarkTime}
                        onChange={(e) => setEditingMarkTime(e.target.value)}
                        className="w-20 h-7 text-xs"
                      />
                      <span className="text-xs font-medium truncate max-w-[100px]">{mark.title}</span>
                      <Button variant="ghost" size="icon" onClick={saveEditedMarkTime} className="h-6 w-6">
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelEditingMark} className="h-6 w-6">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-accent"
                      onClick={() => navigateToMark(mark)}
                    >
                      <span className="text-xs font-medium">{formatTime(mark.time)}</span>
                      <span className="text-xs">•</span>
                      <span className="text-xs truncate max-w-[100px]">{mark.title}</span>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditingMark(mark)
                          }}
                          className="h-4 w-4 ml-1"
                        >
                          <Edit className="h-2 w-2" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMark(mark.id)
                          }}
                          className="h-4 w-4"
                        >
                          <Trash2 className="h-2 w-2" />
                        </Button>
                      </div>
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Transcript panel */}
      <Card className="p-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel("transcript")}>
          <h3 className="text-lg font-semibold">Транскрипция</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {collapsedPanels.transcript ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {!collapsedPanels.transcript && (
          <div className="mt-2 max-h-64 overflow-y-auto">
            <div className="space-y-3">
              {transcript.map((segment) => (
                <div
                  key={segment.id}
                  className={`p-2 rounded ${activeSegmentId === segment.id ? "bg-primary/10 border-l-4 border-primary" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatTime(segment.start)} - {formatTime(segment.end)}
                    </span>
                  </div>

                  {editingTranscriptId === segment.id ? (
                    <div className="flex flex-col space-y-2">
                      <Input
                        value={editingTranscriptText}
                        onChange={(e) => setEditingTranscriptText(e.target.value)}
                        className="w-full text-sm"
                      />
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={saveEditedTranscript}
                          className="flex items-center space-x-1"
                        >
                          <Check className="h-3 w-3" />
                          <span>Сохранить</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEditingTranscript}
                          className="flex items-center space-x-1"
                        >
                          <X className="h-3 w-3" />
                          <span>Отмена</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <p className="text-sm flex-1 cursor-pointer" onClick={() => navigateToSegment(segment)}>
                        {segment.text}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditingTranscript(segment)}
                        className="h-6 w-6 ml-2 mt-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {transcript.length === 0 && <p className="text-sm text-muted-foreground">Загрузка транскрипции...</p>}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
