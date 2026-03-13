import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import '../globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FloatingAssistant } from '@/components/floating-assistant'
import { getEmployerSlug } from '@/lib/content/get-employer'
import { getPublishedContent } from '@/lib/content'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export async function generateMetadata(): Promise<Metadata> {
  try {
    const slug = await getEmployerSlug()
    const content = await getPublishedContent(slug)
    const clientName = content.siteSettings?.clientName || 'Benefits Portal'

    return {
      title: `${clientName} Benefits Portal`,
      description: `Comprehensive benefits information and enrollment for ${clientName} employees`,
    }
  } catch {
    return {
      title: 'Benefits Portal',
      description: 'Comprehensive benefits information and enrollment',
    }
  }
}

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const slug = await getEmployerSlug()
  const content = await getPublishedContent(slug)
  const settings = content.siteSettings
  const chapters = content.benefitChapters

  return (
    <>
      <Header
        logoText={settings?.logoText}
        clientName={settings?.clientName}
        shortName={settings?.shortName}
        clientLogo={settings?.clientLogo}
        chapters={chapters}
      />
      <main className="min-h-screen">
        {children}
      </main>
      <Footer
        clientName={settings?.clientName}
        about={settings?.footerAbout}
        quickLinks={settings?.quickLinks}
        contactInfo={settings?.contactInfo}
        copyrightText={settings?.copyrightText}
        footerContactTitle={settings?.footerContactTitle}
        footerContactDescription={settings?.footerContactDescription}
      />

      <FloatingAssistant />
    </>
  )
}
