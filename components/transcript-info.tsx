import type { TranscriptSegment } from "@/types"
import { formatTime } from "@/lib/utils"

interface TranscriptInfoProps {
  transcript: TranscriptSegment[]
  language: "ru" | "es"
}

export function TranscriptInfo({ transcript, language }: TranscriptInfoProps) {
  if (transcript.length === 0) {
    return (
      <div className="text-xs text-center text-muted-foreground py-1">
        {language === "ru" ? "Транскрипция не загружена" : "Transcripción no cargada"}
      </div>
    )
  }

  const totalDuration = transcript.length > 0 ? transcript[transcript.length - 1].end : 0
  const totalWords = transcript.reduce((count, segment) => {
    return count + segment.text.split(/\s+/).filter(Boolean).length
  }, 0)

  return (
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <div>
        <p className="font-medium">{language === "ru" ? "Сегментов" : "Segmentos"}</p>
        <p className="text-muted-foreground">{transcript.length}</p>
      </div>
      <div>
        <p className="font-medium">{language === "ru" ? "Слов" : "Palabras"}</p>
        <p className="text-muted-foreground">{totalWords}</p>
      </div>
      <div>
        <p className="font-medium">{language === "ru" ? "Длительность" : "Duración"}</p>
        <p className="text-muted-foreground">{formatTime(totalDuration)}</p>
      </div>
    </div>
  )
}
