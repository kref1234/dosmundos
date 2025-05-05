export interface TranscriptSegment {
  id: string
  text: string
  start: number
  end: number
}

export interface PodcastMark {
  id: string
  title: string
  time: number
}

export interface PodcastEpisode {
  id: string
  title: string
  audioUrl: string
  duration: number
  date?: string
  season?: number
}
