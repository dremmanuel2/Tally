import zh from "../../messages/zh.json"
import en from "../../messages/en.json"

export type Locale = "zh" | "en"
export type Messages = typeof zh

const messages: Record<Locale, Messages> = { zh, en }

export function getMessages(locale: Locale): Messages {
  return messages[locale]
}

export function getSupportedLocales(): Locale[] {
  return ["zh", "en"]
}

export function getLocaleLabel(locale: Locale): string {
  return locale === "zh" ? "中文" : "EN"
}
