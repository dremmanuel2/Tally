"use client"

import { signOut } from "next-auth/react"
import { useTranslation } from "@/lib/useTranslation"
import { useLocale } from "@/components/LocaleProvider"

type HeaderProps = {
  user?: { name?: string | null; email?: string | null }
}

export default function Header({ user }: HeaderProps) {
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 md:px-6">
      <button
        onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
        className="md:hidden px-3 py-1.5 text-xs rounded border text-gray-500"
      >
        {locale === "zh" ? "EN" : "中文"}
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline text-sm text-gray-500">{user?.name || user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          {t("nav.logout")}
        </button>
      </div>
    </header>
  )
}
