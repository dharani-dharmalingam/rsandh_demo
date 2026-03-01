/**
 * Server-side API: PDF upload → LlamaParse extract → transform → Sanity seed.
 * POST with multipart/form-data: file (PDF), clientSlug (string), logo (optional image).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { extractBenefitsGuide } from '@/lib/benefits-import/extract'
import { transformToSanitySchema } from '@/lib/benefits-import/transform'
import { seedClientSite } from '@/lib/seedClient'
import { projectId, dataset, apiVersion } from '@/sanity/env'

export const maxDuration = 600

export async function POST(request: Request) {
  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY
    const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
    if (!apiKey) {
      return NextResponse.json(
        { error: 'LLAMA_CLOUD_API_KEY is not set' },
        { status: 500 }
      )
    }
    if (!token) {
      return NextResponse.json(
        { error: 'SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required for seeding' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const clientSlug = (formData.get('clientSlug') as string)?.trim()
    const logoFile = formData.get('logo') as File | null

    if (!file || !clientSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: file (PDF) and clientSlug' },
        { status: 400 }
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    // Create a Sanity client for asset uploads
    const sanityClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
    })

    // ── Upload PDF as a Sanity file asset (for benefits guide download) ──
    console.log(`[benefits-import] Uploading PDF as Sanity file asset...`)
    let benefitsGuideAssetRef: string | undefined
    try {
      const pdfAsset = await sanityClient.assets.upload('file', buffer, {
        filename: `${clientSlug}-benefits-guide.pdf`,
        contentType: 'application/pdf',
      })
      benefitsGuideAssetRef = pdfAsset._id
      console.log(`[benefits-import] PDF uploaded: ${pdfAsset._id}`)
    } catch (uploadErr) {
      console.warn('[benefits-import] PDF asset upload failed, continuing without:', uploadErr)
    }

    // ── Upload logo as a Sanity image asset (if provided) ──
    let logoAssetRef: string | undefined
    if (logoFile) {
      console.log(`[benefits-import] Uploading logo as Sanity image asset...`)
      try {
        const logoBuffer = Buffer.from(await logoFile.arrayBuffer())
        const logoAsset = await sanityClient.assets.upload('image', logoBuffer, {
          filename: logoFile.name || `${clientSlug}-logo`,
          contentType: logoFile.type,
        })
        logoAssetRef = logoAsset._id
        console.log(`[benefits-import] Logo uploaded: ${logoAsset._id}`)
      } catch (uploadErr) {
        console.warn('[benefits-import] Logo upload failed, continuing without:', uploadErr)
      }
    }

    console.log(`[benefits-import] Processing PDF for client: ${clientSlug}`)
    const extractedData = await extractBenefitsGuide(buffer, { apiKey })

    console.log(`[benefits-import] Transforming extracted data...`)
    const payload = await transformToSanitySchema(extractedData, clientSlug)

    // ── Attach asset references to the payload ──
    if (logoAssetRef) {
      (payload.siteSettings as any).clientLogo = {
        _type: 'image',
        asset: { _type: 'reference', _ref: logoAssetRef },
      }
    }
    if (benefitsGuideAssetRef) {
      (payload.openEnrollment as any).benefitsGuide = {
        _type: 'file',
        asset: { _type: 'reference', _ref: benefitsGuideAssetRef },
      }
    }

    console.log(`[benefits-import] Seeding to Sanity...`)
    const { created } = await seedClientSite(payload, {
      projectId,
      dataset,
      apiVersion,
      token,
    })

    return NextResponse.json({
      success: true,
      message: `Site content generated for client "${clientSlug}".`,
      created,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed'
    console.error('[benefits-import]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
