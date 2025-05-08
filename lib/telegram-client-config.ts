// Конфигурация для Telegram Client API
export const telegramClientConfig = {
  // Эти значения нужно будет заменить на ваши после регистрации приложения
  apiId: process.env.TELEGRAM_API_ID ? Number.parseInt(process.env.TELEGRAM_API_ID) : 0,
  apiHash: process.env.TELEGRAM_API_HASH || "",

  // Строка сессии для сохранения авторизации
  // В реальном приложении должна храниться в базе данных
  sessionString: process.env.TELEGRAM_SESSION_STRING || "",

  // Имя канала для получения медитаций
  channelUsername: "meditationdosmundos",
}
