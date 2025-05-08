"use client"

import { useState } from "react"
import type { PodcastMark } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { formatTime, parseTimeString } from "@/lib/utils"
import { Edit, Check, X, Trash2, Clock } from "lucide-react"

interface MarksViewProps {
  marks: PodcastMark[]
  onMarkClick: (mark: PodcastMark) => void
  onMarkEdit?: (mark: PodcastMark, newTime?: number, newTitle?: string) => void
  onMarkDelete?: (markId: string) => void
  language: "ru" | "es"
}

export function MarksView({ marks, onMarkClick, onMarkEdit, onMarkDelete, language }: MarksViewProps) {
  const [editingMarkId, setEditingMarkId] = useState<string | null>(null)
  const [editingMarkTime, setEditingMarkTime] = useState<string>("")
  const [editingMarkTitle, setEditingMarkTitle] = useState<string>("")
  const [editMode, setEditMode] = useState<"time" | "title">("time")

  const startEditing = (mark: PodcastMark, mode: "time" | "title") => {
    if (!onMarkEdit) return
    setEditingMarkId(mark.id)
    setEditMode(mode)

    if (mode === "time") {
      setEditingMarkTime(formatTime(mark.time))
    } else {
      setEditingMarkTitle(mark.title)
    }
  }

  const saveEdit = (mark: PodcastMark) => {
    if (!onMarkEdit || !editingMarkId) return

    if (editMode === "time") {
      const seconds = parseTimeString(editingMarkTime)
      if (seconds === null) return
      onMarkEdit(mark, seconds, undefined)
    } else {
      if (!editingMarkTitle.trim()) return
      onMarkEdit(mark, undefined, editingMarkTitle)
    }

    setEditingMarkId(null)
    setEditingMarkTime("")
    setEditingMarkTitle("")
  }

  const cancelEdit = () => {
    setEditingMarkId(null)
    setEditingMarkTime("")
    setEditingMarkTitle("")
  }

  if (marks.length === 0) {
    return (
      <div className="text-xs text-center text-muted-foreground py-1">
        {language === "ru"
          ? "Нет меток. Добавьте метки для быстрой навигации."
          : "No hay marcas. Agregue marcas para una navegación rápida."}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {marks.map((mark) => (
        <div key={mark.id} className="relative">
          {editingMarkId === mark.id ? (
            <div className="border rounded-md p-2 bg-muted/30">
              {editMode === "time" ? (
                <div className="flex items-center space-x-1 mb-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <Input
                    value={editingMarkTime}
                    onChange={(e) => setEditingMarkTime(e.target.value)}
                    className="w-20 h-7 text-xs"
                    placeholder="00:00"
                  />
                </div>
              ) : (
                <div className="mb-2">
                  <Input
                    value={editingMarkTitle}
                    onChange={(e) => setEditingMarkTitle(e.target.value)}
                    className="w-full h-7 text-xs"
                    placeholder={language === "ru" ? "Название метки" : "Título de la marca"}
                  />
                </div>
              )}
              <div className="flex justify-end space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveEdit(mark)}
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
            <div
              className="flex items-center p-2 rounded-md border border-primary/20 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
              onClick={() => onMarkClick(mark)}
            >
              <Badge variant="secondary" className="font-mono mr-2">
                {formatTime(mark.time)}
              </Badge>
              <span className="flex-1 text-sm truncate">{mark.title}</span>
              <div className="flex items-center ml-2">
                {onMarkEdit && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(mark, "time")
                      }}
                      className="h-6 w-6"
                      title={language === "ru" ? "Изменить время" : "Editar tiempo"}
                    >
                      <Clock className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditing(mark, "title")
                      }}
                      className="h-6 w-6"
                      title={language === "ru" ? "Изменить название" : "Editar título"}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </>
                )}
                {onMarkDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkDelete(mark.id)
                    }}
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    title={language === "ru" ? "Удалить метку" : "Eliminar marca"}
                  >
                    <Trash2 className="h-3 w-3" />
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
