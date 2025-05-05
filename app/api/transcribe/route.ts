import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { audioUrl, episodeId } = await request.json()

    if (!audioUrl || !episodeId) {
      return NextResponse.json({ error: "Audio URL and episode ID are required" }, { status: 400 })
    }

    // Проверяем, начинается ли URL с tg://
    let publicAudioUrl = audioUrl
    if (audioUrl.startsWith("tg://")) {
      // Извлекаем file_id из tg:// URL
      const fileId = audioUrl.replace("tg://file?id=", "")

      // Получаем публичный URL через Telegram API
      const response = await fetch(`/api/telegram/file?fileId=${fileId}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      publicAudioUrl = data.fileUrl
    }

    // Проверяем, есть ли уже транскрипция для этого эпизода
    // В реальном приложении здесь был бы запрос к базе данных

    // Отправляем аудио в AssemblyAI для транскрипции
    const assemblyApiKey = process.env.ASSEMBLYAI_API_KEY

    if (!assemblyApiKey) {
      return NextResponse.json({ error: "AssemblyAI API key not configured" }, { status: 500 })
    }

    // Создаем задачу транскрипции
    const transcriptionResponse = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "POST",
      headers: {
        Authorization: assemblyApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: publicAudioUrl,
        language_code: "ru", // Используем русский язык
        speaker_labels: true, // Определение говорящих
        auto_chapters: true, // Автоматическое разделение на главы
      }),
    })

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.json()
      throw new Error(`AssemblyAI error: ${JSON.stringify(errorData)}`)
    }

    const transcriptionData = await transcriptionResponse.json()
    const transcriptId = transcriptionData.id

    // Для демонстрационных целей мы не будем ждать завершения транскрипции
    // В реальном приложении вы бы использовали webhook или периодически проверяли статус

    // Возвращаем ID транскрипции и временные данные
    return NextResponse.json({
      transcriptId,
      status: "processing",
      message: "Transcription is being processed",
      // Временные данные для отображения
      segments: Array.from({ length: 10 }, (_, i) => ({
        id: `${episodeId}-segment-${i + 1}`,
        text: `Транскрипция обрабатывается... Это временный текст для сегмента ${i + 1}.`,
        start: i * 30,
        end: (i + 1) * 30,
      })),
    })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}
