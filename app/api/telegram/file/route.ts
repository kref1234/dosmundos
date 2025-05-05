import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const fileId = url.searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    // Получаем токен из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return NextResponse.json({ error: "Bot token not configured" }, { status: 500 })
    }

    console.log(`Getting file info for file ID: ${fileId}`)

    // Получаем информацию о файле
    const getFileResponse = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`)
    const fileData = await getFileResponse.json()

    console.log("File info response:", JSON.stringify(fileData))

    if (!fileData.ok) {
      throw new Error(`Failed to get file from Telegram: ${fileData.description || "Unknown error"}`)
    }

    const filePath = fileData.result.file_path

    // Формируем URL для скачивания файла
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`

    console.log(`File URL: ${fileUrl}`)

    return NextResponse.json({ fileUrl })
  } catch (error) {
    console.error("Telegram API error:", error)
    return NextResponse.json({ error: "Failed to get file from Telegram" }, { status: 500 })
  }
}
