import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const channelId = url.searchParams.get("channelId") || "meditationdosmundos"

    // Получаем токен из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 })
    }

    console.log(`Fetching data for channel: ${channelId}`)

    // Для публичного канала используем username вместо ID
    const isNumericId = /^-?\d+$/.test(channelId)
    const chatIdentifier = isNumericId ? channelId : `@${channelId}`

    // Получаем информацию о канале
    const chatInfoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${chatIdentifier}`)

    const chatInfo = await chatInfoResponse.json()
    console.log("Chat info response:", JSON.stringify(chatInfo))

    if (!chatInfo.ok) {
      throw new Error(`Failed to get chat info: ${chatInfo.description || "Unknown error"}`)
    }

    // Пытаемся получить последние сообщения из канала
    // Для этого используем getUpdates с фильтром по типу сообщения
    const updatesResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?allowed_updates=["channel_post"]&limit=100`,
    )

    const updates = await updatesResponse.json()
    console.log("Updates response:", JSON.stringify(updates))

    // Фильтруем обновления, относящиеся к нашему каналу и содержащие аудио
    let audioMessages = []

    if (updates.ok) {
      const channelUpdates = updates.result.filter(
        (update) =>
          update.channel_post &&
          update.channel_post.chat &&
          (update.channel_post.chat.id.toString() === channelId || update.channel_post.chat.username === channelId) &&
          update.channel_post.audio,
      )

      console.log(`Found ${channelUpdates.length} audio updates for this channel`)

      audioMessages = channelUpdates.map((update) => {
        const audio = update.channel_post.audio
        return {
          id: `msg-${update.channel_post.message_id}`,
          title: audio.title || `Аудио ${update.channel_post.message_id}`,
          audioUrl: `https://api.telegram.org/file/bot${botToken}/${audio.file_id}`,
          duration: audio.duration,
          date: new Date(update.channel_post.date * 1000).toISOString(),
          performer: audio.performer || "Unknown",
        }
      })
    }

    // Если не удалось получить аудио через API, используем тестовые данные для канала Dos Mundos
    if (audioMessages.length === 0) {
      console.log("No audio messages found, using mock data")

      // Создаем тестовые данные для медитаций
      const meditationTitles = [
        "Медитация для глубокого расслабления",
        "Медитация осознанности",
        "Медитация для сна",
        "Утренняя медитация",
        "Медитация для снятия стресса",
        "Медитация благодарности",
        "Медитация для концентрации",
        "Медитация для начинающих",
        "Медитация для гармонии",
        "Медитация для позитивного мышления",
      ]

      audioMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `dos-mundos-${i + 1}`,
        title: meditationTitles[i],
        audioUrl: [
          "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
          "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg",
          "https://commondatastorage.googleapis.com/codeskulptor-assets/Evillaugh.ogg",
        ][i % 3],
        duration: 180 + i * 30,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        performer: "Dos Mundos Медитации",
      }))
    }

    // Возвращаем информацию о канале и аудиофайлы
    return NextResponse.json({
      episodes: audioMessages,
      channelInfo: {
        title: chatInfo.result.title || "Dos Mundos Медитации",
        username: chatInfo.result.username || "meditationdosmundos",
        description: chatInfo.result.description || "Канал с медитациями для гармонии и расслабления",
        photoUrl: chatInfo.result.photo?.big_file_id
          ? `https://api.telegram.org/file/bot${botToken}/${chatInfo.result.photo.big_file_id}`
          : null,
      },
    })
  } catch (error) {
    console.error("Telegram API error:", error)

    // В случае ошибки возвращаем тестовые данные
    const meditationTitles = [
      "Медитация для глубокого расслабления",
      "Медитация осознанности",
      "Медитация для сна",
      "Утренняя медитация",
      "Медитация для снятия стресса",
      "Медитация благодарности",
      "Медитация для концентрации",
      "Медитация для начинающих",
      "Медитация для гармонии",
      "Медитация для позитивного мышления",
    ]

    const audioMessages = Array.from({ length: 10 }, (_, i) => ({
      id: `dos-mundos-${i + 1}`,
      title: meditationTitles[i],
      audioUrl: [
        "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
        "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg",
        "https://commondatastorage.googleapis.com/codeskulptor-assets/Evillaugh.ogg",
      ][i % 3],
      duration: 180 + i * 30,
      date: new Date(Date.now() - i * 86400000).toISOString(),
      performer: "Dos Mundos Медитации",
    }))

    return NextResponse.json({
      episodes: audioMessages,
      channelInfo: {
        title: "Dos Mundos Медитации",
        username: "meditationdosmundos",
        description: "Канал с медитациями для гармонии и расслабления",
        photoUrl: null,
      },
      error: "Используются тестовые данные из-за ошибки API",
    })
  }
}
