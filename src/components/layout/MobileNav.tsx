"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/lib/useTranslation"

const links = [
  { href: "/dashboard", labelKey: "nav.dashboard" },
  { href: "/transactions", labelKey: "nav.transactions" },
  { href: "/bank-cards", labelKey: "nav.bankCards" },
  { href: "/common-notes", labelKey: "nav.commonNotes" },
]

export default function MobileNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-14">
        {links.map((link) => {
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-0.5 text-xs ${
                active ? "text-blue-600 font-medium" : "text-gray-500"
              }`}
            >
              {t(link.labelKey)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
