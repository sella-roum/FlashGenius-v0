import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ZustandProvider } from "@/lib/providers/zustand-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FlashGenius",
  description: "AIを活用してフラッシュカードを効率的に生成・学習するためのインタラクティブなWebアプリケーション",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ZustandProvider>
            {children}
            <Toaster />
          </ZustandProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
