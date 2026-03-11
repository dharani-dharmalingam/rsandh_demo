/**
 * Server-side API: Phase 2 — Extract values with confirmed plans → transform → seed to Sanity.
 * POST with JSON body: { fileAssetId, clientSlug, logoAssetId?, confirmedPlans, companyName?, themeColor? }
 */

import { NextResponse } from 'next/server'
import { extractWithConfirmedPlans, fetchWithRetry } from '@/lib/benefits-import/extract'
import { transformToSanitySchema } from '@/lib/benefits-import/transform'
import { seedClientSite } from '@/lib/seedClient'
import { projectId, dataset, apiVersion } from '@/sanity/env'
import type { DetectedPlans, CustomTemplateDefinition } from '@/lib/benefits-import/types'

export const maxDuration = 300

export async function POST(request: Request) {
    try {
        const apiKey = process.env.LLAMA_CLOUD_API_KEY
        const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_TOKEN
        if (!apiKey) {
            return NextResponse.json(
                { error: 'LLAMA_CLOUD_API_KEY is not set in environment variables.' },
                { status: 500 }
            )
        }
        if (!token) {
            return NextResponse.json(
                { error: 'SANITY_WRITE_TOKEN or SANITY_API_TOKEN is required.' },
                { status: 500 }
            )
        }

        const body = await request.json()
        const {
            fileAssetId,
            clientSlug,
            logoAssetId,
            confirmedPlans,
            companyName,
            themeColor,
            chaptersList,
            templateIds,
            customTemplates,
        } = body as {
            fileAssetId: string
            clientSlug: string
            chunkIndex?: number
            logoAssetId?: string
            confirmedPlans: DetectedPlans
            companyName?: string
            themeColor?: string
            chaptersList?: string[]
            templateIds?: string[]
            customTemplates?: CustomTemplateDefinition[]
        }

        if (!fileAssetId || !clientSlug || !confirmedPlans) {
            return NextResponse.json(
                { error: 'Missing required fields: fileAssetId, clientSlug, confirmedPlans' },
                { status: 400 }
            )
        }

        // Fetch PDF from Sanity asset using retry-capable fetch (matches Phase 1 resilience)
        console.log(`[benefits-import] Phase 2: Fetching PDF from Sanity asset: ${fileAssetId}`)
        const metadataUrl = `https://${projectId}.api.sanity.io/v${apiVersion}/data/doc/${dataset}/${fileAssetId}`
        const metaRes = await fetchWithRetry(metadataUrl, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000,
        })
        if (!metaRes.ok) {
            const errText = await metaRes.text()
            throw new Error(`Failed to fetch asset metadata: ${metaRes.status} ${errText}`)
        }
        const metaData = await metaRes.json()
        const asset = metaData.documents && metaData.documents[0]
        if (!asset || !asset.url) {
            throw new Error(`Could not find URL for asset ID: ${fileAssetId}`)
        }

        console.log(`[benefits-import] Phase 2: Downloading PDF from ${asset.url}`)
        const response = await fetchWithRetry(asset.url as string, {
            method: 'GET',
            timeout: 120000,
        })
        if (!response.ok) throw new Error(`Failed to fetch PDF from Sanity CDN: ${response.statusText}`)
        const buffer = Buffer.from(await response.arrayBuffer())
        console.log(`[benefits-import] Phase 2: PDF fetched successfully. Size: ${Math.round(buffer.length / 1024)}KB`)

        // Phase 2: Extract values with confirmed plans
        console.log(`[benefits-import] Phase 2: Extracting values for client: ${clientSlug}...`)
        const extractedData = await extractWithConfirmedPlans(
            buffer,
            confirmedPlans,
            { apiKey },
            { companyName, themeColor, chaptersList },
            templateIds,
            customTemplates
        )
        console.log(`[benefits-import] Phase 2 extraction complete.`)

        // Transform
        console.log(`[benefits-import] Transforming extracted data for client: ${clientSlug}...`)
        const payload = await transformToSanitySchema(extractedData, clientSlug)
        console.log(`[benefits-import] Transformation complete.`)

        // Attach asset references
        if (logoAssetId) {
            (payload.siteSettings as any).clientLogo = {
                _type: 'image',
                asset: { _type: 'reference', _ref: logoAssetId },
            }
        }
        if (fileAssetId) {
            (payload.openEnrollment as any).benefitsGuide = {
                _type: 'file',
                asset: { _type: 'reference', _ref: fileAssetId },
            }
        }

        // Seed to Sanity
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
        const message = err instanceof Error ? err.message : 'Phase 2 extraction failed'
        console.error('[benefits-import]', err)
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
