"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import type { Locale, Messages } from "@/lib/i18n"
import { getMessages } from "@/lib/i18n"

type LocaleContextType = {
  locale: Locale
  messages: Messages
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType | null>(null)

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider")
  return ctx
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "zh"
  const stored = localStorage.getItem("locale") as Locale | null
  return stored || "zh"
}

export default function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", l)
    }
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, messages: getMessages(locale), setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}
