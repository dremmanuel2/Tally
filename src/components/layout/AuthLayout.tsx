"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { ReactNode } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (status === "unauthenticated") {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header user={session?.user} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
