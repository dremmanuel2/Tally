import type { Metadata } from "next"
import "./globals.css"
import AuthProvider from "@/components/SessionProvider"
import LocaleProvider from "@/components/LocaleProvider"

export const metadata: Metadata = {
  title: "Tally - 记账本",
  description: "Personal finance tracking app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 font-sans">
        <AuthProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
