import { useLocale } from "@/components/LocaleProvider"

export function useTranslation() {
  const { messages } = useLocale()

  function t(path: string): string {
    const keys = path.split(".")
    let result: unknown = messages
    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = (result as Record<string, unknown>)[key]
      } else {
        return path
      }
    }
    return typeof result === "string" ? result : path
  }

  return { t }
}
