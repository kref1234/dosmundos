export interface TranscriptSegment {
  id: string
  text: string
  start: number
  end: number
  speaker?: string
}

export interface PodcastMark {
  id: string
  title: string
  time: number
  summary?: string
}

export interface PodcastEpisode {
  id: string
  title: string
  audioUrl: string
  duration: number
  date?: string
  season?: number
}

export interface TranscriptionChapter {
  id: string
  title: string
  summary?: string
  start: number
  end: number
}
