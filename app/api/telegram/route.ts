import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const channelId = url.searchParams.get("channelId")

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID is required" }, { status: 400 })
    }

    // Получаем токен из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 })
    }

    // Получаем сообщения из канала
    const getMessagesResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?chat_id=${channelId}&limit=100`,
    )

    const messagesData = await getMessagesResponse.json()

    if (!messagesData.ok) {
      throw new Error("Failed to get messages from Telegram channel")
    }

    // Фильтруем аудио сообщения
    const audioMessages = messagesData.result
      .filter((update) => update.message && update.message.audio)
      .map((update) => {
        const msg = update.message
        return {
          id: `msg-${msg.message_id}`,
          title: msg.audio.title || `Audio ${msg.message_id}`,
          audioUrl: `tg://file?id=${msg.audio.file_id}`,
          duration: msg.audio.duration,
          date: new Date(msg.date * 1000).toISOString(),
          performer: msg.audio.performer || "Unknown",
        }
      })

    return NextResponse.json({ episodes: audioMessages })
  } catch (error) {
    console.error("Telegram API error:", error)
    return NextResponse.json({ error: "Failed to get audio files from Telegram channel" }, { status: 500 })
  }
}
