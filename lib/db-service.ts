import type { PodcastMark, DatabaseMark } from "@/types"

// Ключи для localStorage
const MARKS_KEY = "podcast_player_marks"

// Сервис для работы с базой данных (localStorage)
export const dbService = {
  // Получение всех меток
  getMarks: (): DatabaseMark[] => {
    try {
      const marksJson = localStorage.getItem(MARKS_KEY)
      return marksJson ? JSON.parse(marksJson) : []
    } catch (error) {
      console.error("Error getting marks from localStorage:", error)
      return []
    }
  },

  // Получение меток для конкретного эпизода
  getMarksByEpisodeId: (episodeId: string): DatabaseMark[] => {
    try {
      const marks = dbService.getMarks()
      return marks.filter((mark) => mark.episodeId === episodeId)
    } catch (error) {
      console.error("Error getting marks by episode ID:", error)
      return []
    }
  },

  // Добавление новой метки
  addMark: (mark: PodcastMark): boolean => {
    try {
      const marks = dbService.getMarks()
      marks.push(mark)
      localStorage.setItem(MARKS_KEY, JSON.stringify(marks))
      return true
    } catch (error) {
      console.error("Error adding mark to localStorage:", error)
      return false
    }
  },

  // Обновление существующей метки
  updateMark: (updatedMark: PodcastMark): boolean => {
    try {
      const marks = dbService.getMarks()
      const index = marks.findIndex((mark) => mark.id === updatedMark.id)

      if (index !== -1) {
        marks[index] = updatedMark
        localStorage.setItem(MARKS_KEY, JSON.stringify(marks))
        return true
      }

      return false
    } catch (error) {
      console.error("Error updating mark in localStorage:", error)
      return false
    }
  },

  // Удаление метки
  deleteMark: (markId: string): boolean => {
    try {
      const marks = dbService.getMarks()
      const filteredMarks = marks.filter((mark) => mark.id !== markId)

      if (filteredMarks.length !== marks.length) {
        localStorage.setItem(MARKS_KEY, JSON.stringify(filteredMarks))
        return true
      }

      return false
    } catch (error) {
      console.error("Error deleting mark from localStorage:", error)
      return false
    }
  },

  // Удаление всех меток для эпизода
  deleteMarksByEpisodeId: (episodeId: string): boolean => {
    try {
      const marks = dbService.getMarks()
      const filteredMarks = marks.filter((mark) => mark.episodeId !== episodeId)
      localStorage.setItem(MARKS_KEY, JSON.stringify(filteredMarks))
      return true
    } catch (error) {
      console.error("Error deleting marks by episode ID:", error)
      return false
    }
  },

  // Очистка всех меток
  clearMarks: (): boolean => {
    try {
      localStorage.removeItem(MARKS_KEY)
      return true
    } catch (error) {
      console.error("Error clearing marks from localStorage:", error)
      return false
    }
  },
}
