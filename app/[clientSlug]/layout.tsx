import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import '../globals.css'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FloatingAssistant } from '@/components/floating-assistant'
import { sanityFetch, SanityLive } from '@/sanity/lib/live'
import { VisualEditing } from 'next-sanity/visual-editing'
import { draftMode } from 'next/headers'
import { siteSettingsQuery } from '@/sanity/lib/queries'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

type Props = {
  children: React.ReactNode
  params: Promise<{ clientSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { clientSlug } = await params
  const { data: settings } = await sanityFetch({
    query: siteSettingsQuery,
    params: { clientSlug }
  });
  const clientName = settings?.clientName || 'RS&H';

  return {
    title: `${clientName} Benefits Portal`,
    description: `Comprehensive benefits information and enrollment for ${clientName} employees`,
    generator: 'v0.app',
  }
}

export default async function ClientLayout({
  children,
  params,
}: Props) {
  const { clientSlug } = await params
  const { data: settings } = await sanityFetch({
    query: siteSettingsQuery,
    params: { clientSlug }
  });

  return (
    <>
      <Header
        logoText={settings?.logoText}
        clientName={settings?.clientName}
        shortName={settings?.shortName}
        clientLogo={settings?.clientLogo}
        clientSlug={clientSlug}
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
      />
      <FloatingAssistant />
      <SanityLive />
      {(await draftMode()).isEnabled && <VisualEditing />}
    </>
  )
}
