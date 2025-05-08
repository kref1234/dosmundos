export interface TranscriptSegment {
  id: string
  text: string
  start: number
  end: number
  language: "ru" | "es"
}

export interface PodcastMark {
  id: string
  title: string
  time: number
  episodeId: string
  createdAt: string
}

export interface PodcastEpisode {
  id: string
  title: string
  audioUrl: string
  duration: number
  date: string
  transcriptRu?: TranscriptSegment[]
  transcriptEs?: TranscriptSegment[]
}

export interface TranscriptFile {
  language: "ru" | "es"
  segments: TranscriptSegment[]
}

export interface DatabaseMark extends PodcastMark {}

export interface UploadedFile {
  file: File
  url: string
}
