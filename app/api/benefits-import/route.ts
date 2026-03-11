/**
 * Server-side API: Phase 1 — PDF upload → LlamaExtract plan detection → return for review.
 * POST with multipart/form-data: file (PDF) or fileAssetId, clientSlug, logo (optional).
 *
 * Returns detected plans, chapters, company name, and asset IDs for Phase 2.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { detectPlans, fetchWithRetry } from '@/lib/benefits-import/extract'
import { projectId, dataset, apiVersion } from '@/sanity/env'

export const maxDuration = 900 // Increase max duration for long extractions

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY
    const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN

    console.log(`[benefits-import] POST /api/benefits-import started at ${new Date().toISOString()}`)

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
        { error: 'SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileAssetId = formData.get('fileAssetId') as string | null
    const clientSlug = (formData.get('clientSlug') as string)?.trim()
    const logoFile = formData.get('logo') as File | null
    const logoAssetId = formData.get('logoAssetId') as string | null

    console.log(`[benefits-import] Headers: clientSlug=${clientSlug}, filePresent=${!!file}, fileAssetId=${fileAssetId}`)

    if ((!file && !fileAssetId) || !clientSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: file (or fileAssetId) and clientSlug' },
        { status: 400 }
      )
    }

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
      console.log(`[benefits-import] Processing uploaded file: ${file.name} (${Math.round(file.size / 1024)}KB)`)
      buffer = Buffer.from(await file.arrayBuffer())

      if (!benefitsGuideAssetRef) {
        console.log(`[benefits-import] Uploading raw PDF to Sanity...`)
        try {
          // Keep using sanityClient for upload as it's a multipart upload
          const pdfAsset = await sanityClient.assets.upload('file', buffer, {
            filename: `${clientSlug}-benefits-guide.pdf`,
            contentType: 'application/pdf',
          })
          benefitsGuideAssetRef = pdfAsset._id
          console.log(`[benefits-import] PDF uploaded to Sanity: ${pdfAsset._id}`)
        } catch (uploadErr) {
          console.warn('[benefits-import] PDF asset upload failed:', uploadErr)
        }
      }
    } else if (fileAssetId) {
      console.log(`[benefits-import] Fetching PDF from Sanity asset ID: ${fileAssetId}`)

      // Instead of getDocument(), use direct fetch for more control and retry support
      const metadataUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/doc/${dataset}/${fileAssetId}`
      console.log(`[benefits-import] Fetching metadata from: ${metadataUrl}`)

      const metaRes = await fetchWithRetry(metadataUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      })

      if (!metaRes.ok) {
        const errText = await metaRes.text()
        throw new Error(`Failed to fetch asset metadata from Sanity: ${metaRes.status} ${errText}`)
      }

      const metaData = await metaRes.json()
      const asset = metaData.documents && metaData.documents[0]

      if (!asset || !asset.url) {
        console.error('[benefits-import] Full Metadata Response:', JSON.stringify(metaData))
        throw new Error(`Could not find URL for asset ID: ${fileAssetId}. Response but no asset.`)
      }

      console.log(`[benefits-import] Asset found! URL: ${asset.url}. Downloading PDF...`)

      // Use our retry-capable fetch for the PDF download
      const response = await fetchWithRetry(asset.url as string, {
        method: 'GET',
        timeout: 120000, // 2 minutes for actual file download
      })

      if (!response.ok) {
        throw new Error(`Failed to download PDF from Sanity CDN: ${response.status} ${response.statusText}`)
      }

      buffer = Buffer.from(await response.arrayBuffer())
      console.log(`[benefits-import] PDF successfully fetched. Size: ${Math.round(buffer.length / 1024)}KB`)
    } else {
      throw new Error('No PDF content provided')
    }

    // Upload logo if provided as file
    let logoAssetRef = logoAssetId || undefined
    if (logoFile && !logoAssetRef) {
      console.log(`[benefits-import] Processing logo: ${logoFile.name}`)
      try {
        const logoBuffer = Buffer.from(await logoFile.arrayBuffer())
        const logoAsset = await sanityClient.assets.upload('image', logoBuffer, {
          filename: logoFile.name || `${clientSlug}-logo`,
          contentType: logoFile.type,
        })
        logoAssetRef = logoAsset._id
        console.log(`[benefits-import] Logo uploaded to Sanity: ${logoAsset._id}`)
      } catch (uploadErr) {
        console.warn('[benefits-import] Logo upload failed:', uploadErr)
      }
    }

    // ── Phase 1: Detect Plans ──
    const detectionStart = Date.now()
    console.log(`[benefits-import] Phase 1: Calling detectPlans for client: ${clientSlug}... (PDF: ${Math.round(buffer.length / 1024)}KB)`)
    const phase1Result = await detectPlans(buffer, { apiKey })

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1)
    const detectionDuration = ((Date.now() - detectionStart) / 1000).toFixed(1)
    console.log(`[benefits-import] Phase 1 detection took ${detectionDuration}s. Total time: ${totalDuration}s.`)

    return NextResponse.json({
      success: true,
      phase: 1,
      ...phase1Result,
      fileAssetId: benefitsGuideAssetRef,
      logoAssetId: logoAssetRef,
      clientSlug,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Phase 1 detection failed'
    console.error('[benefits-import]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
