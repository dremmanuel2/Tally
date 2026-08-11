import { ReactNode } from "react"
import AuthLayout from "@/components/layout/AuthLayout"

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>
}
