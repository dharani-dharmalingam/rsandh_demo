import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Benefits Portal',
    description: 'Comprehensive benefits information and enrollment',
}

import { SanityLive } from '@/sanity/lib/live'
import { VisualEditing } from 'next-sanity/visual-editing'
import { draftMode } from 'next/headers'

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body className="font-sans antialiased bg-white">
                {children}
                <SanityLive />
                {/* @ts-ignore */}
                {(await draftMode()).isEnabled && <VisualEditing studioUrl="/sanity" />}
            </body>
        </html>
    )
}
