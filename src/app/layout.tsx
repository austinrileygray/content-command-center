import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { CommandPalette } from "@/components/layout/command-palette"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Content Command Center",
  description: "AI-powered content production dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <CommandPalette />
        </Providers>
      </body>
    </html>
  )
}


