/**
 * Pipeline Upload — Accept base64-encoded PDF and/or logo, upload to Supabase Storage.
 *
 * POST { slug, pdf_base64?, logo_base64?, logo_mime? }
 *   - Decodes base64 → Buffer → uploads to employer-assets/{slug}/
 *   - Returns public URLs for both files
 *
 * Used by the MCP tool `upload_pdf` so Claude.ai can upload files directly
 * from the chat without a separate admin UI.
 */

import { NextResponse } from 'next/server'
import { uploadPdf, uploadLogo, getPublicUrl, isSupabaseConfigured } from '@/lib/supabase/storage'

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
    }

    const body = await request.json() as {
      slug?: string
      pdf_base64?: string
      logo_base64?: string
      logo_mime?: string
    }

    const slug = body.slug?.trim()
    if (!slug) {
      return NextResponse.json({ error: 'Missing required field: slug' }, { status: 400 })
    }
    if (!body.pdf_base64 && !body.logo_base64) {
      return NextResponse.json({ error: 'Provide at least one of: pdf_base64, logo_base64' }, { status: 400 })
    }

    const uploaded: { pdf?: string; logo?: string } = {}

    if (body.pdf_base64) {
      const pdfBuffer = Buffer.from(body.pdf_base64, 'base64')
      const path = await uploadPdf(slug, pdfBuffer)
      uploaded.pdf = getPublicUrl(path)
      console.log(`[pipeline/upload] PDF uploaded: ${path}`)
    }

    if (body.logo_base64) {
      const logoBuffer = Buffer.from(body.logo_base64, 'base64')
      const mime = body.logo_mime ?? 'image/png'
      const path = await uploadLogo(slug, logoBuffer, mime)
      uploaded.logo = getPublicUrl(path)
      console.log(`[pipeline/upload] Logo uploaded: ${path}`)
    }

    return NextResponse.json({
      success: true,
      slug,
      ...uploaded,
      nextStep: `Files uploaded. Now call parse_pdf tool with slug: "${slug}"`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    console.error('[pipeline/upload]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
