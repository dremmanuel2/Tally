"use client"

import { signOut } from "next-auth/react"
import { useTranslation } from "@/lib/useTranslation"

type HeaderProps = {
  user?: { name?: string | null; email?: string | null }
}

export default function Header({ user }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user?.name || user?.email}</span>
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
