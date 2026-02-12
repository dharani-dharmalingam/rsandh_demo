import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FloatingAssistant } from '@/components/floating-assistant'
import { sanityFetch, SanityLive } from '@/sanity/lib/live'
import { VisualEditing } from 'next-sanity/visual-editing'
import { draftMode } from 'next/headers'
import { siteSettingsQuery } from '@/sanity/lib/queries'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RS&H Benefits Portal',
  description: 'Comprehensive benefits information and enrollment for RS&H employees',
  generator: 'v0.app',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { data: settings } = await sanityFetch({ query: siteSettingsQuery });

  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white">
        <Header logoText={settings?.logoText} />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer
          about={settings?.footerAbout}
          quickLinks={settings?.quickLinks}
          contactInfo={settings?.contactInfo}
          copyrightText={settings?.copyrightText}
        />
        <FloatingAssistant />
        <SanityLive />
        {(await draftMode()).isEnabled && <VisualEditing />}
      </body>
    </html>
  )
}
