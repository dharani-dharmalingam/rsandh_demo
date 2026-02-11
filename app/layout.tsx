import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FloatingAssistant } from '@/components/floating-assistant'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RS&H Benefits Portal',
  description: 'Comprehensive benefits information and enrollment for RS&H employees',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white">
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <FloatingAssistant />
      </body>
    </html>
  )
}
