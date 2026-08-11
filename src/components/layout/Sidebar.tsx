"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/lib/useTranslation"
import { useLocale } from "@/components/LocaleProvider"

const links = [
  { href: "/dashboard", labelKey: "nav.dashboard" },
  { href: "/transactions", labelKey: "nav.transactions" },
  { href: "/bank-cards", labelKey: "nav.bankCards" },
  { href: "/common-notes", labelKey: "nav.commonNotes" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { locale, setLocale } = useLocale()

  return (
    <aside className="w-56 bg-white border-r min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="text-lg font-bold">
          Tally
        </Link>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map((link) => {
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-sm ${
                active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {t(link.labelKey)}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          className="w-full px-3 py-1.5 text-xs rounded border text-gray-500 hover:bg-gray-50"
        >
          {locale === "zh" ? "EN" : "中文"}
        </button>
      </div>
    </aside>
  )
}
