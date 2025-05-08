import type { TranscriptSegment, TranscriptFile } from "@/types"

// Парсинг JSON файла с транскрипцией
export const parseTranscriptFile = async (file: File): Promise<Record<string, TranscriptFile>> => {
  try {
    // Читаем содержимое файла
    const text = await file.text()

    // Парсим JSON
    const data = JSON.parse(text)
    const result: Record<string, TranscriptFile> = {}

    // Проверяем наличие языковых ключей
    const supportedLanguages = ["ru", "es"]
    let foundLanguages = false

    // Проверяем формат с языковыми ключами в корне
    for (const lang of supportedLanguages) {
      if (data[lang]) {
        foundLanguages = true
        const langData = data[lang]

        // Проверяем наличие массива words
        if (Array.isArray(langData.words)) {
          // Группируем слова в предложения на основе пауз или знаков препинания
          const segments: TranscriptSegment[] = []
          let currentSegment: { words: any[]; start: number; end: number } | null = null

          langData.words.forEach((word: any, index: number) => {
            // Если нет текущего сегмента или большая пауза между словами (более 1 секунды)
            const isNewSegment =
              !currentSegment || word.start - currentSegment.end > 1000 || index === langData.words.length - 1

            if (isNewSegment && currentSegment) {
              // Завершаем текущий сегмент
              const segmentText = currentSegment.words.map((w: any) => w.text).join(" ")
              segments.push({
                id: `segment-${lang}-${segments.length}`,
                text: segmentText,
                start: currentSegment.start / 1000, // Конвертируем в секунды
                end: currentSegment.end / 1000,
                language: lang as "ru" | "es",
              })
              currentSegment = null
            }

            if (!currentSegment) {
              // Начинаем новый сегмент
              currentSegment = {
                words: [word],
                start: word.start,
                end: word.end,
              }
            } else {
              // Добавляем слово к текущему сегменту
              currentSegment.words.push(word)
              currentSegment.end = word.end
            }

            // Обрабатываем последнее слово
            if (index === langData.words.length - 1 && currentSegment) {
              const segmentText = currentSegment.words.map((w: any) => w.text).join(" ")
              segments.push({
                id: `segment-${lang}-${segments.length}`,
                text: segmentText,
                start: currentSegment.start / 1000,
                end: currentSegment.end / 1000,
                language: lang as "ru" | "es",
              })
            }
          })

          result[lang] = {
            language: lang as "ru" | "es",
            segments,
          }
        }
      }
    }

    // Если нашли языки в корне, возвращаем результат
    if (foundLanguages) {
      return result
    }

    // Если не нашли языки в корне, пробуем другие форматы
    // Для совместимости со старым форматом, создаем транскрипцию для активного языка
    const rawSegments = data.segments || data.results?.segments || []

    if (Array.isArray(rawSegments) && rawSegments.length > 0) {
      // Определяем язык по содержимому (простая эвристика)
      const sampleText = rawSegments[0].text || ""
      const detectedLang = detectLanguage(sampleText)

      // Преобразуем сегменты в нужный формат
      const segments: TranscriptSegment[] = rawSegments.map((segment: any, index: number) => ({
        id: `segment-${detectedLang}-${index}`,
        text: segment.text || "",
        start: (segment.start || segment.start_time || 0) / 1000, // Конвертируем в секунды, если нужно
        end: (segment.end || segment.end_time || 0) / 1000,
        language: detectedLang,
      }))

      result[detectedLang] = {
        language: detectedLang,
        segments,
      }

      return result
    }

    // Если не удалось распознать формат, выбрасываем ошибку
    throw new Error("Unsupported transcript format")
  } catch (error) {
    console.error("Error parsing transcript file:", error)
    return {}
  }
}

// Простая функция определения языка по тексту
function detectLanguage(text: string): "ru" | "es" {
  // Русские символы
  const ruRegex = /[а-яА-ЯёЁ]/
  // Испанские символы (включая специфические для испанского)
  const esRegex = /[áéíóúüñ¿¡]/i

  if (ruRegex.test(text)) return "ru"
  if (esRegex.test(text)) return "es"

  // По умолчанию возвращаем русский
  return "ru"
}
