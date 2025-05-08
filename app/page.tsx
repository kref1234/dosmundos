"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookmarkPlus, Trash2, Upload, FileAudio, Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AudioPlayer } from "@/components/audio-player"
import { TranscriptView } from "@/components/transcript-view"
import { MarksView } from "@/components/marks-view"
import { parseTranscriptFile } from "@/lib/transcript-parser"
import { dbService } from "@/lib/db-service"
import { formatTime } from "@/lib/utils"
import type { PodcastEpisode, TranscriptSegment, PodcastMark, UploadedFile } from "@/types"
import { FileUpload } from "@/components/file-upload"

// Демо-данные для имитации загруженных администратором файлов
const DEMO_EPISODES = [
  {
    id: "episode-1",
    title: "Медитация для глубокого расслабления",
    audioUrl:
      "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
    duration: 180,
    date: new Date().toISOString(),
  },
  {
    id: "episode-2",
    title: "Медитация осознанности",
    audioUrl: "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg",
    duration: 210,
    date: new Date().toISOString(),
  },
]

export default function PodcastPlayer() {
  // Состояние эпизода
  const [episode, setEpisode] = useState<PodcastEpisode | null>(null)
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>(DEMO_EPISODES)
  const [isAddingEpisode, setIsAddingEpisode] = useState(false)
  const [newEpisodeTitle, setNewEpisodeTitle] = useState("")

  // Состояние аудио
  const [audioFile, setAudioFile] = useState<UploadedFile | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Состояние транскрипции
  const [transcriptRu, setTranscriptRu] = useState<TranscriptSegment[]>([])
  const [transcriptEs, setTranscriptEs] = useState<TranscriptSegment[]>([])
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [isTranscriptUploading, setIsTranscriptUploading] = useState(false)

  // Состояние меток
  const [marks, setMarks] = useState<PodcastMark[]>([])
  const [markTitle, setMarkTitle] = useState("")

  // Состояние интерфейса
  const [activeTab, setActiveTab] = useState<"ru" | "es">("ru")

  const { toast } = useToast()

  // Загрузка меток из базы данных при выборе эпизода
  useEffect(() => {
    if (episode?.id) {
      const savedMarks = dbService.getMarksByEpisodeId(episode.id)
      setMarks(savedMarks)
    }
  }, [episode?.id])

  // Имитация загрузки транскрипции для демо-эпизода
  useEffect(() => {
    if (episode && !transcriptRu.length && !transcriptEs.length) {
      // Создаем демо-транскрипцию
      const demoTranscriptRu: TranscriptSegment[] = Array.from({ length: 10 }, (_, i) => ({
        id: `segment-ru-${i}`,
        text: `Это часть транскрипции на русском языке, сегмент ${i + 1}. Здесь будет текст, распознанный с помощью AssemblyAI.`,
        start: i * 15,
        end: (i + 1) * 15,
        language: "ru",
      }))

      const demoTranscriptEs: TranscriptSegment[] = Array.from({ length: 10 }, (_, i) => ({
        id: `segment-es-${i}`,
        text: `Esta es una parte de la transcripción en español, segmento ${i + 1}. Aquí estará el texto reconocido por AssemblyAI.`,
        start: i * 15,
        end: (i + 1) * 15,
        language: "es",
      }))

      setTranscriptRu(demoTranscriptRu)
      setTranscriptEs(demoTranscriptEs)
    }
  }, [episode, transcriptRu.length, transcriptEs.length])

  // Выбор эпизода
  const selectEpisode = (selectedEpisode: PodcastEpisode) => {
    setEpisode(selectedEpisode)
    setCurrentTime(0)
    setDuration(selectedEpisode.duration)
    setTranscriptRu([])
    setTranscriptEs([])
    setActiveSegmentId(null)
  }

  // Обработка загрузки нового эпизода
  const handleNewEpisodeUpload = (uploadedFile: UploadedFile) => {
    if (!newEpisodeTitle.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите название эпизода",
        variant: "destructive",
      })
      return
    }

    const newEpisode: PodcastEpisode = {
      id: `episode-${Date.now()}`,
      title: newEpisodeTitle,
      audioUrl: uploadedFile.url,
      duration: 0,
      date: new Date().toISOString(),
    }

    setEpisodes([...episodes, newEpisode])
    setAudioFile(uploadedFile)
    setIsAddingEpisode(false)
    setNewEpisodeTitle("")

    toast({
      title: "Эпизод добавлен",
      description: newEpisode.title,
    })

    // Автоматически выбираем новый эпизод
    selectEpisode(newEpisode)
  }

  // Обработка загрузки транскрипции (для администратора)
  const handleTranscriptUpload = async (uploadedFile: UploadedFile) => {
    try {
      setIsTranscriptUploading(true)
      const transcriptData = await parseTranscriptFile(uploadedFile.file)

      if (Object.keys(transcriptData).length === 0) {
        throw new Error("Failed to parse transcript file")
      }

      // Обрабатываем русскую транскрипцию
      if (transcriptData.ru) {
        setTranscriptRu(transcriptData.ru.segments)

        // Обновляем эпизод с русской транскрипцией
        if (episode) {
          setEpisode({
            ...episode,
            transcriptRu: transcriptData.ru.segments,
          })
        }
      }

      // Обрабатываем испанскую транскрипцию
      if (transcriptData.es) {
        setTranscriptEs(transcriptData.es.segments)

        // Обновляем эпизод с испанской транскрипцией
        if (episode) {
          setEpisode({
            ...episode,
            transcriptEs: transcriptData.es.segments,
          })
        }
      }

      // Формируем сообщение об успешной загрузке
      const ruSegments = transcriptData.ru?.segments.length || 0
      const esSegments = transcriptData.es?.segments.length || 0

      toast({
        title: "Транскрипция загружена",
        description: `Загружено ${ruSegments} сегментов на русском и ${esSegments} на испанском`,
      })
    } catch (error) {
      console.error("Error loading transcript:", error)
      toast({
        title: activeTab === "ru" ? "Ошибка загрузки транскрипции" : "Error al cargar la transcripción",
        description: activeTab === "ru" ? "Проверьте формат файла JSON" : "Verifique el formato del archivo JSON",
        variant: "destructive",
      })
    } finally {
      setIsTranscriptUploading(false)
    }
  }

  // Добавление новой метки
  const addMark = (time: number = currentTime, title: string = markTitle) => {
    if (!episode) return

    if (!title.trim()) {
      toast({
        title: activeTab === "ru" ? "Ошибка" : "Error",
        description: activeTab === "ru" ? "Введите название метки" : "Ingrese el título de la marca",
        variant: "destructive",
      })
      return
    }

    const newMark: PodcastMark = {
      id: `mark-${Date.now()}`,
      title: title,
      time: time,
      episodeId: episode.id,
      createdAt: new Date().toISOString(),
    }

    // Сохраняем метку в базу данных
    dbService.addMark(newMark)

    // Обновляем состояние
    setMarks([...marks, newMark].sort((a, b) => a.time - b.time))
    setMarkTitle("")

    toast({
      title: activeTab === "ru" ? "Метка добавлена" : "Marca añadida",
      description: `${newMark.title} (${formatTime(time)})`,
    })
  }

  // Обработчик добавления метки из транскрипции
  const handleAddMarkFromTranscript = (time: number, suggestedTitle: string) => {
    addMark(time, suggestedTitle)
  }

  // Редактирование метки
  const handleMarkEdit = (mark: PodcastMark, newTime?: number, newTitle?: string) => {
    const updatedMark = {
      ...mark,
      ...(newTime !== undefined ? { time: newTime } : {}),
      ...(newTitle !== undefined ? { title: newTitle } : {}),
    }

    // Обновляем метку в базе данных
    dbService.updateMark(updatedMark)

    // Обновляем состояние
    setMarks(marks.map((m) => (m.id === mark.id ? updatedMark : m)).sort((a, b) => a.time - b.time))

    toast({
      title: activeTab === "ru" ? "Метка обновлена" : "Marca actualizada",
      description: newTime !== undefined ? `${mark.title} (${formatTime(newTime)})` : updatedMark.title,
    })
  }

  // Удаление метки
  const handleMarkDelete = (markId: string) => {
    // Удаляем метку из базы данных
    dbService.deleteMark(markId)

    // Обновляем состояние
    const markToDelete = marks.find((m) => m.id === markId)
    setMarks(marks.filter((m) => m.id !== markId))

    if (markToDelete) {
      toast({
        title: activeTab === "ru" ? "Метка удалена" : "Marca eliminada",
        description: markToDelete.title,
      })
    }
  }

  // Редактирование транскрипции
  const handleTranscriptEdit = (segment: TranscriptSegment, newText: string) => {
    if (segment.language === "ru") {
      setTranscriptRu(transcriptRu.map((s) => (s.id === segment.id ? { ...s, text: newText } : s)))

      // Обновляем эпизод
      if (episode) {
        setEpisode({
          ...episode,
          transcriptRu: transcriptRu.map((s) => (s.id === segment.id ? { ...s, text: newText } : s)),
        })
      }
    } else {
      setTranscriptEs(transcriptEs.map((s) => (s.id === segment.id ? { ...s, text: newText } : s)))

      // Обновляем эпизод
      if (episode) {
        setEpisode({
          ...episode,
          transcriptEs: transcriptEs.map((s) => (s.id === segment.id ? { ...s, text: newText } : s)),
        })
      }
    }

    toast({
      title: activeTab === "ru" ? "Транскрипция обновлена" : "Transcripción actualizada",
    })
  }

  // Навигация к сегменту транскрипции
  const navigateToSegment = (segment: TranscriptSegment) => {
    setCurrentTime(segment.start)
    setActiveSegmentId(segment.id)
  }

  // Навигация к метке
  const navigateToMark = (mark: PodcastMark) => {
    setCurrentTime(mark.time)
  }

  // Обновление активного сегмента при изменении времени
  useEffect(() => {
    const transcript = activeTab === "ru" ? transcriptRu : transcriptEs

    const activeSegment = transcript.find((segment) => currentTime >= segment.start && currentTime <= segment.end)

    if (activeSegment) {
      setActiveSegmentId(activeSegment.id)
    }
  }, [currentTime, activeTab, transcriptRu, transcriptEs])

  return (
    <div className="container mx-auto py-4 max-w-2xl">
      {/* Выбор эпизода */}
      {!episode ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>{activeTab === "ru" ? "Выберите эпизод" : "Seleccione un episodio"}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsAddingEpisode(!isAddingEpisode)} className="h-8">
              {isAddingEpisode ? (
                activeTab === "ru" ? (
                  "Отмена"
                ) : (
                  "Cancelar"
                )
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  {activeTab === "ru" ? "Добавить" : "Añadir"}
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {isAddingEpisode ? (
              <div className="space-y-3">
                <Input
                  value={newEpisodeTitle}
                  onChange={(e) => setNewEpisodeTitle(e.target.value)}
                  placeholder={activeTab === "ru" ? "Название эпизода" : "Título del episodio"}
                  className="mb-2"
                />
                <FileUpload
                  onFileUploaded={handleNewEpisodeUpload}
                  accept="audio/*"
                  label={activeTab === "ru" ? "Загрузить аудио" : "Cargar audio"}
                  icon={<FileAudio className="h-5 w-5 text-primary" />}
                />
              </div>
            ) : (
              <div className="space-y-2">
                {episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="p-3 border rounded-md cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => selectEpisode(ep)}
                  >
                    <h3 className="font-medium">{ep.title}</h3>
                    <p className="text-sm text-muted-foreground">{formatTime(ep.duration)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Название эпизода и аудио плеер */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base flex justify-between items-center">
                <span>{activeTab === "ru" ? "Аудиофайл" : "Archivo de audio"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEpisode(null)
                    setMarks([])
                    setTranscriptRu([])
                    setTranscriptEs([])
                  }}
                  className="h-6 text-xs"
                >
                  {activeTab === "ru" ? "Назад" : "Atrás"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <h3 className="text-sm font-medium mb-2 truncate">{episode.title}</h3>
              <AudioPlayer
                audioUrl={episode.audioUrl}
                onTimeUpdate={setCurrentTime}
                onDurationChange={setDuration}
                language={activeTab}
                currentTime={currentTime}
              />
            </CardContent>
          </Card>

          {/* Метки */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base flex justify-between items-center">
                <span>{activeTab === "ru" ? "Метки" : "Marcas"}</span>
                {marks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (episode) {
                        dbService.deleteMarksByEpisodeId(episode.id)
                        setMarks([])
                        toast({
                          title: activeTab === "ru" ? "Метки удалены" : "Marcas eliminadas",
                        })
                      }
                    }}
                    className="h-6 flex items-center space-x-1 text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span className="text-xs">{activeTab === "ru" ? "Очистить" : "Limpiar"}</span>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Input
                  placeholder={activeTab === "ru" ? "Название метки" : "Título de la marca"}
                  value={markTitle}
                  onChange={(e) => setMarkTitle(e.target.value)}
                  className="flex-1 h-8 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMark()}
                  className="h-8 flex items-center space-x-1"
                >
                  <BookmarkPlus className="h-3 w-3" />
                  <span className="text-xs">{activeTab === "ru" ? "Добавить" : "Añadir"}</span>
                </Button>
              </div>

              <MarksView
                marks={marks}
                onMarkClick={navigateToMark}
                onMarkEdit={handleMarkEdit}
                onMarkDelete={handleMarkDelete}
                language={activeTab}
              />
            </CardContent>
          </Card>

          {/* Транскрипция */}
          <Card>
            <CardHeader className="p-3 pb-0">
              <CardTitle className="text-base flex justify-between items-center">
                <span>{activeTab === "ru" ? "Транскрипция" : "Transcripción"}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs flex items-center gap-1"
                  disabled={isTranscriptUploading}
                  onClick={() => {
                    // Создаем скрытый input для выбора файла
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = ".json"
                    input.onchange = async (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.files && target.files.length > 0) {
                        const file = target.files[0]
                        const url = URL.createObjectURL(file)
                        await handleTranscriptUpload({ file, url })
                      }
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-3 w-3" />
                  <span>
                    {isTranscriptUploading
                      ? activeTab === "ru"
                        ? "Загрузка..."
                        : "Cargando..."
                      : activeTab === "ru"
                        ? "Загрузить JSON"
                        : "Cargar JSON"}
                  </span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "ru" | "es")}>
                <TabsList className="grid w-full grid-cols-2 mb-3">
                  <TabsTrigger value="ru">Русский</TabsTrigger>
                  <TabsTrigger value="es">Español</TabsTrigger>
                </TabsList>
                <TabsContent value="ru">
                  <TranscriptView
                    transcript={transcriptRu}
                    activeSegmentId={activeSegmentId}
                    onSegmentClick={navigateToSegment}
                    onSegmentEdit={handleTranscriptEdit}
                    onAddMark={handleAddMarkFromTranscript}
                    language="ru"
                  />
                </TabsContent>
                <TabsContent value="es">
                  <TranscriptView
                    transcript={transcriptEs}
                    activeSegmentId={activeSegmentId}
                    onSegmentClick={navigateToSegment}
                    onSegmentEdit={handleTranscriptEdit}
                    onAddMark={handleAddMarkFromTranscript}
                    language="es"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
