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

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY
    const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
    if (!apiKey) {
      console.error('[benefits-import] Error: LLAMA_CLOUD_API_KEY is missing.')
      return NextResponse.json(
        { error: 'LLAMA_CLOUD_API_KEY is not set in environment variables.' },
        { status: 500 }
      )
    }
    if (!token) {
      console.error('[benefits-import] Error: SANITY_WRITE_TOKEN (or SANITY_API_TOKEN) is missing.')
      return NextResponse.json(
        { error: 'SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required for seeding clients.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileAssetId = formData.get('fileAssetId') as string | null
    const clientSlug = (formData.get('clientSlug') as string)?.trim()
    const logoFile = formData.get('logo') as File | null
    const logoAssetId = formData.get('logoAssetId') as string | null

    if ((!file && !fileAssetId) || !clientSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: file (or fileAssetId) and clientSlug' },
        { status: 400 }
      )
    }

    // Create a Sanity client for asset operations
    const sanityClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
    })

    let buffer: Buffer
    let benefitsGuideAssetRef = fileAssetId || undefined

    if (file) {
      // Flow A: Raw file upload (limited by Vercel 4.5MB)
      buffer = Buffer.from(await file.arrayBuffer())

      if (!benefitsGuideAssetRef) {
        console.log(`[benefits-import] Uploading raw PDF to Sanity...`)
        try {
          const pdfAsset = await sanityClient.assets.upload('file', buffer, {
            filename: `${clientSlug}-benefits-guide.pdf`,
            contentType: 'application/pdf',
          })
          benefitsGuideAssetRef = pdfAsset._id
          console.log(`[benefits-import] PDF uploaded: ${pdfAsset._id}`)
        } catch (uploadErr) {
          console.warn('[benefits-import] PDF asset upload failed:', uploadErr)
        }
      }
    } else if (fileAssetId) {
      // Flow B: Asset ID provided (bypasses Vercel 4.5MB limit)
      console.log(`[benefits-import] Fetching PDF from Sanity asset: ${fileAssetId}`)
      const asset = await sanityClient.getDocument(fileAssetId)
      if (!asset || !('url' in asset)) {
        throw new Error(`Could not find asset or URL for ID: ${fileAssetId}`)
      }
      const response = await fetch(asset.url as string)
      if (!response.ok) throw new Error(`Failed to fetch PDF from Sanity CDN: ${response.statusText}`)
      buffer = Buffer.from(await response.arrayBuffer())
    } else {
      throw new Error('No PDF content provided')
    }

    // ── Upload logo if provided as file and not already as asset ──
    let logoAssetRef = logoAssetId || undefined
    if (logoFile && !logoAssetRef) {
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
        console.warn('[benefits-import] Logo upload failed:', uploadErr)
      }
    }

    console.log(`[benefits-import] Starting LlamaParse extraction for client: ${clientSlug}...`)
    const extractedData = await extractBenefitsGuide(buffer, { apiKey })
    console.log(`[benefits-import] Extraction complete. Received ${Object.keys(extractedData || {}).length} data points.`)

    console.log(`[benefits-import] Transforming extracted data for client: ${clientSlug}...`)
    const payload = await transformToSanitySchema(extractedData, clientSlug)
    console.log(`[benefits-import] Transformation complete.`)

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

    console.log(`[benefits-import] Seeding to Sanity for client: ${clientSlug}...`)
    const { created } = await seedClientSite(payload, {
      projectId,
      dataset,
      apiVersion,
      token,
    })
    console.log(`[benefits-import] Seeding complete. Created ${created?.length || 0} documents.`)

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
