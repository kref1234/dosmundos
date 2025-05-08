import { NextResponse } from "next/server"
import { telegramClient } from "@/lib/telegram-client"
import { telegramClientConfig } from "@/lib/telegram-client-config"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const channelUsername = url.searchParams.get("channelId") || telegramClientConfig.channelUsername

    // Проверяем, настроен ли Telegram Client API
    if (!telegramClientConfig.apiId || !telegramClientConfig.apiHash) {
      return NextResponse.json(
        {
          error: "Telegram Client API не настроен. Необходимо зарегистрировать приложение в Telegram API.",
          setupInstructions: true,
        },
        { status: 500 },
      )
    }

    // Если нет сохраненной сессии, возвращаем инструкции по настройке
    if (!telegramClientConfig.sessionString) {
      return NextResponse.json(
        {
          error: "Требуется авторизация в Telegram. Необходимо получить строку сессии.",
          setupInstructions: true,
        },
        { status: 401 },
      )
    }

    // Получаем сообщения из канала
    const messages = await telegramClient.getChannelMessages(channelUsername)

    // Обрабатываем полученные сообщения
    const episodes = await Promise.all(
      messages.map(async (message: any, index: number) => {
        // Получаем информацию о медиа
        const media = message.media
        if (!media || !media.document) {
          return null
        }

        // Получаем атрибуты аудио
        const audioAttributes = media.document.attributes.find(
          (attr: any) => attr.className === "DocumentAttributeAudio",
        )

        // Получаем URL для скачивания файла
        // В реальном приложении здесь будет логика для получения URL
        // Для демонстрации мы просто используем заглушку
        const fileInfo = {
          url: [
            "https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3",
            "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg",
            "https://commondatastorage.googleapis.com/codeskulptor-assets/Evillaugh.ogg",
          ][index % 3],
        }

        return {
          id: `msg-${message.id}`,
          title: audioAttributes?.title || `Аудио ${message.id}`,
          audioUrl: fileInfo.url,
          duration: audioAttributes?.duration || 180,
          date: new Date(message.date * 1000).toISOString(),
          performer: audioAttributes?.performer || "Unknown",
        }
      }),
    )

    // Фильтруем null значения
    const validEpisodes = episodes.filter(Boolean)

    // Если не удалось получить аудио, возвращаем ошибку
    if (validEpisodes.length === 0) {
      return NextResponse.json(
        {
          error: "Не удалось получить аудио из канала",
          setupInstructions: true,
        },
        { status: 404 },
      )
    }

    // Возвращаем информацию о канале и аудиофайлы
    return NextResponse.json({
      episodes: validEpisodes,
      channelInfo: {
        title: "Канал получен через Telegram Client API",
        username: channelUsername,
        description: "Аудиофайлы получены с использованием Telegram Client API",
        photoUrl: null,
      },
    })
  } catch (error) {
    console.error("Telegram Client API error:", error)
    return NextResponse.json(
      {
        error: "Ошибка при получении данных через Telegram Client API",
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
        setupInstructions: true,
      },
      { status: 500 },
    )
  }
}
