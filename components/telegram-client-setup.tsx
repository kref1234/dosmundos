import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface TelegramClientSetupProps {
  error?: string
}

export function TelegramClientSetup({ error }: TelegramClientSetupProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Настройка Telegram Client API</CardTitle>
        <CardDescription>
          Для доступа к сообщениям канала без прав администратора необходимо настроить Telegram Client API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Шаг 1: Регистрация приложения в Telegram API</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Перейдите на сайт{" "}
              <a
                href="https://my.telegram.org/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                my.telegram.org/apps
              </a>
            </li>
            <li>Войдите в свой аккаунт Telegram</li>
            <li>Создайте новое приложение, заполнив все необходимые поля</li>
            <li>
              После создания приложения вы получите <strong>API ID</strong> и <strong>API Hash</strong>
            </li>
          </ol>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Шаг 2: Настройка переменных окружения</h3>
          <p>Добавьте следующие переменные окружения в ваш проект:</p>
          <pre className="bg-muted p-2 rounded-md overflow-x-auto">
            <code>
              TELEGRAM_API_ID=ваш_api_id
              <br />
              TELEGRAM_API_HASH=ваш_api_hash
            </code>
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Шаг 3: Получение строки сессии</h3>
          <p>
            Для авторизации в Telegram API необходимо получить строку сессии. Это можно сделать с помощью скрипта,
            который запросит ваш номер телефона и код подтверждения.
          </p>
          <p>После получения строки сессии добавьте её в переменные окружения:</p>
          <pre className="bg-muted p-2 rounded-md overflow-x-auto">
            <code>TELEGRAM_SESSION_STRING=ваша_строка_сессии</code>
          </pre>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Шаг 4: Перезапуск приложения</h3>
          <p>После настройки всех переменных окружения перезапустите приложение, чтобы изменения вступили в силу.</p>
        </div>

        <Alert>
          <AlertTitle>Важно!</AlertTitle>
          <AlertDescription>
            Никогда не публикуйте ваш API ID, API Hash и строку сессии в публичном доступе. Эти данные дают полный
            доступ к вашему аккаунту Telegram.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
