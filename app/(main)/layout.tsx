import type React from "react"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">{children}</main>
      <Footer />
    </div>
  )
}
