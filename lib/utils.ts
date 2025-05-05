import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds)) return "00:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function parseTimeString(timeString: string): number | null {
  // Handle MM:SS format
  const mmssRegex = /^(\d{1,2}):(\d{1,2})$/
  // Handle HH:MM:SS format
  const hhmmssRegex = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/

  let hours = 0
  let minutes = 0
  let seconds = 0

  if (hhmmssRegex.test(timeString)) {
    const [, h, m, s] = timeString.match(hhmmssRegex) || []
    hours = Number.parseInt(h, 10)
    minutes = Number.parseInt(m, 10)
    seconds = Number.parseInt(s, 10)
  } else if (mmssRegex.test(timeString)) {
    const [, m, s] = timeString.match(mmssRegex) || []
    minutes = Number.parseInt(m, 10)
    seconds = Number.parseInt(s, 10)
  } else {
    return null
  }

  if (minutes >= 60 || seconds >= 60) {
    return null
  }

  return hours * 3600 + minutes * 60 + seconds
}
