"use client"

import { useState } from "react"
import type { TranscriptSegment } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatTime } from "@/lib/utils"
import { Edit, Check, X, BookmarkPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface TranscriptViewProps {
  transcript: TranscriptSegment[]
  activeSegmentId: string | null
  onSegmentClick: (segment: TranscriptSegment) => void
  onSegmentEdit?: (segment: TranscriptSegment, newText: string) => void
  onAddMark?: (time: number, suggestedTitle: string) => void
  language: "ru" | "es"
}

export function TranscriptView({
  transcript,
  activeSegmentId,
  onSegmentClick,
  onSegmentEdit,
  onAddMark,
  language,
}: TranscriptViewProps) {
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>("")

  const startEditing = (segment: TranscriptSegment) => {
    if (!onSegmentEdit) return
    setEditingSegmentId(segment.id)
    setEditingText(segment.text)
  }

  const saveEdit = (segment: TranscriptSegment) => {
    if (!onSegmentEdit || !editingSegmentId) return
    onSegmentEdit(segment, editingText)
    setEditingSegmentId(null)
    setEditingText("")
  }

  const cancelEdit = () => {
    setEditingSegmentId(null)
    setEditingText("")
  }

  const handleAddMark = (segment: TranscriptSegment) => {
    if (!onAddMark) return
    // Используем первые 30 символов текста как предлагаемое название метки
    const suggestedTitle = segment.text.substring(0, 30) + (segment.text.length > 30 ? "..." : "")
    onAddMark(segment.start, suggestedTitle)
  }

  if (transcript.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {language === "ru"
          ? "Транскрипция не загружена. Загрузите JSON файл с транскрипцией."
          : "Transcripción no cargada. Cargue un archivo JSON con la transcripción."}
      </div>
    )
  }

  return (
    <div className="space-y-1 max-h-[400px] overflow-y-auto p-1">
      {transcript.map((segment) => (
        <div
          key={segment.id}
          className={`p-1.5 rounded text-sm ${
            activeSegmentId === segment.id ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-accent/50"
          }`}
        >
          {editingSegmentId === segment.id ? (
            <div className="flex flex-col space-y-1">
              <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="w-full text-sm" />
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveEdit(segment)}
                  className="h-7 text-xs flex items-center space-x-1"
                >
                  <Check className="h-3 w-3" />
                  <span>{language === "ru" ? "Сохранить" : "Guardar"}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  className="h-7 text-xs flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>{language === "ru" ? "Отмена" : "Cancelar"}</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start">
              <Badge variant="outline" className="shrink-0 mr-2 h-5 px-1 text-xs font-mono">
                {formatTime(segment.start)}
              </Badge>
              <p className="flex-1 cursor-pointer" onClick={() => onSegmentClick(segment)}>
                {segment.text}
              </p>
              <div className="flex ml-1 shrink-0">
                {onAddMark && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAddMark(segment)}
                    className="h-5 w-5"
                    title={language === "ru" ? "Добавить метку" : "Añadir marca"}
                  >
                    <BookmarkPlus className="h-3 w-3" />
                  </Button>
                )}
                {onSegmentEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(segment)}
                    className="h-5 w-5"
                    title={language === "ru" ? "Редактировать" : "Editar"}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
