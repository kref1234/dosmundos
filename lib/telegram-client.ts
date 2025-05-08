import { Api, TelegramClient } from "telegram"
import { StringSession } from "telegram/sessions"
import { telegramClientConfig } from "./telegram-client-config"

// Класс для работы с Telegram Client API
export class TelegramClientService {
  private client: TelegramClient | null = null
  private isConnected = false

  // Инициализация клиента
  async initialize() {
    if (this.isConnected) return

    try {
      const { apiId, apiHash, sessionString } = telegramClientConfig

      if (!apiId || !apiHash) {
        throw new Error("Telegram API ID и API Hash не настроены")
      }

      const stringSession = new StringSession(sessionString)

      this.client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 3,
      })

      await this.client.connect()
      this.isConnected = true

      // Если нет сохраненной сессии, нужно будет авторизоваться
      // В реальном приложении здесь должна быть логика для авторизации
      if (!this.client.connected) {
        throw new Error("Не удалось подключиться к Telegram API")
      }
    } catch (error) {
      console.error("Ошибка инициализации Telegram Client:", error)
      throw error
    }
  }

  // Получение сообщений из канала
  async getChannelMessages(username: string, limit = 100) {
    if (!this.client) {
      await this.initialize()
    }

    try {
      if (!this.client) {
        throw new Error("Клиент Telegram не инициализирован")
      }

      // Получаем информацию о канале
      const entity = await this.client.getEntity(username)

      // Получаем сообщения из канала
      const messages = await this.client.getMessages(entity, {
        limit,
        // Фильтруем только сообщения с аудио
        filter: new Api.InputMessagesFilterAudio(),
      })

      return messages
    } catch (error) {
      console.error("Ошибка получения сообщений из канала:", error)
      throw error
    }
  }

  // Получение URL для скачивания файла
  async getFileUrl(message: any) {
    if (!this.client) {
      await this.initialize()
    }

    try {
      if (!this.client) {
        throw new Error("Клиент Telegram не инициализирован")
      }

      // Получаем медиа из сообщения
      const media = message.media
      if (!media) {
        throw new Error("Сообщение не содержит медиа")
      }

      // Скачиваем медиа и получаем буфер
      const buffer = await this.client.downloadMedia(media, {})

      // В реальном приложении здесь нужно сохранить буфер в файл
      // и вернуть URL для доступа к нему
      // Для демонстрации мы просто вернем размер буфера
      return {
        size: buffer.length,
        // В реальном приложении здесь будет URL
        url: `data:audio/mp3;base64,${buffer.toString("base64")}`,
      }
    } catch (error) {
      console.error("Ошибка получения URL файла:", error)
      throw error
    }
  }

  // Закрытие соединения
  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.disconnect()
      this.isConnected = false
    }
  }
}

// Создаем экземпляр сервиса
export const telegramClient = new TelegramClientService()
