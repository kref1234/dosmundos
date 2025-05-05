import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const transcriptId = url.searchParams.get("id")

    if (!transcriptId) {
      return NextResponse.json({ error: "Transcript ID is required" }, { status: 400 })
    }

    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY

    if (!assemblyApiKey) {
      return NextResponse.json({ error: "AssemblyAI API key not configured" }, { status: 500 })
    }

    // Проверяем статус транскрипции
    const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: {
        Authorization: assemblyApiKey,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`AssemblyAI error: ${JSON.stringify(errorData)}`)
    }

    const transcriptData = await response.json()

    // Если транскрипция еще не завершена
    if (transcriptData.status !== "completed") {
      return NextResponse.json({
        status: transcriptData.status,
        message: `Transcription is ${transcriptData.status}`,
        progress: transcriptData.status === "processing" ? "in progress" : "queued",
      })
    }

    // Если транскрипция завершена, обрабатываем результаты
    // Преобразуем слова в сегменты по предложениям
    const segments =
      transcriptData.utterances?.map((utterance, index) => ({
        id: `segment-${index}`,
        text: utterance.text,
        start: utterance.start / 1000, // Конвертируем из миллисекунд в секунды
        end: utterance.end / 1000,
        speaker: utterance.speaker,
      })) || []

    // Если нет utterances, используем words для создания сегментов
    if (segments.length === 0 && transcriptData.words) {
      // Группируем слова в предложения (примерно по 10-15 слов)
      const words = transcriptData.words
      const wordsPerSegment = 12

      for (let i = 0; i < words.length; i += wordsPerSegment) {
        const segmentWords = words.slice(i, i + wordsPerSegment)
        if (segmentWords.length > 0) {
          segments.push({
            id: `segment-${i / wordsPerSegment}`,
            text: segmentWords.map((w) => w.text).join(" "),
            start: segmentWords[0].start / 1000,
            end: segmentWords[segmentWords.length - 1].end / 1000,
            speaker: "unknown",
          })
        }
      }
    }

    // Получаем главы, если они есть
    const chapters =
      transcriptData.chapters?.map((chapter, index) => ({
        id: `chapter-${index}`,
        title: chapter.headline || `Глава ${index + 1}`,
        summary: chapter.summary,
        start: chapter.start / 1000,
        end: chapter.end / 1000,
      })) || []

    return NextResponse.json({
      status: "completed",
      segments,
      chapters,
      text: transcriptData.text,
      audio_duration: transcriptData.audio_duration / 1000, // в секундах
    })
  } catch (error) {
    console.error("Error checking transcription status:", error)
    return NextResponse.json({ error: "Failed to check transcription status" }, { status: 500 })
  }
}
