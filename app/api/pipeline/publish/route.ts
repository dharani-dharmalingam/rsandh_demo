/**
 * Pipeline Skill 3 — extracted_documents → transform → content_drafts → Git → Vercel.
 *
 * POST { slug, logoAssetId?, themeColor? }
 *   - Reads ExtractedBenefitsData from extracted_documents table
 *   - Runs transformToSanitySchema + seedPayloadToLocalContent
 *   - Sets logo URL and benefits guide URL from Supabase Storage
 *   - Saves published content to content_drafts table
 *   - Commits content/<slug>.published.json to Git (triggers Vercel deploy)
 *
 * Requires: Supabase configured, GITHUB_TOKEN, GITHUB_REPO.
 */

import { NextResponse } from 'next/server'
import { getExtractedData } from '@/lib/supabase/pipeline-store'
import { upsertContentJson } from '@/lib/supabase/content-store'
import { commitContentToGit } from '@/lib/git-commit'
import { transformToSanitySchema } from '@/lib/benefits-import/transform'
import { seedPayloadToLocalContent } from '@/lib/benefits-import/to-local-content'
import { isSupabaseConfigured, getPublicUrl, pdfPath, logoPath } from '@/lib/supabase/storage'

export const maxDuration = 120

export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
    }

    const body = await request.json() as {
      slug?: string
      logoAssetId?: string
      themeColor?: string
    }
    const slug = body.slug?.trim()
    if (!slug) {
      return NextResponse.json({ error: 'Missing required field: slug' }, { status: 400 })
    }

    // 1. Read extracted data from DB
    const extracted = await getExtractedData(slug)
    if (!extracted) {
      return NextResponse.json(
        { error: `No extracted data found for "${slug}". Run Skill 2 first.` },
        { status: 404 }
      )
    }

    // Override themeColor if provided
    if (body.themeColor) {
      extracted.themeColor = body.themeColor
    }

    // 2. Transform through the existing pipeline
    console.log(`[pipeline/publish] Transforming extracted data for: ${slug}`)
    const seed = await transformToSanitySchema(extracted, slug)
    const content = seedPayloadToLocalContent(seed)

    // 3. Set logo and benefits guide URLs from Supabase Storage
    const logoAssetId = body.logoAssetId ?? logoPath(slug)
    content.siteSettings.clientLogo = getPublicUrl(logoAssetId)
    content.openEnrollment.benefitsGuideUrl = getPublicUrl(pdfPath(slug))

    // 4. Save to content_drafts table
    await upsertContentJson(slug, content)
    console.log(`[pipeline/publish] Content saved to content_drafts for: ${slug}`)

    // 5. Commit to Git → triggers Vercel deploy
    const gitResult = await commitContentToGit(slug, content)
    if (gitResult.success) {
      console.log(`[pipeline/publish] Git commit: ${gitResult.commitSha}`)
    } else {
      console.warn(`[pipeline/publish] Git commit skipped: ${gitResult.message}`)
    }

    return NextResponse.json({
      success: true,
      slug,
      chaptersCount: content.benefitChapters.length,
      companyName: content.client.name,
      committedToGit: gitResult.success,
      commitSha: gitResult.commitSha ?? null,
      message: gitResult.success
        ? `Published "${slug}" and committed to Git. Vercel is deploying.`
        : `Content saved to Supabase for "${slug}". Git auto-commit skipped: ${gitResult.message}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Publish failed'
    console.error('[pipeline/publish]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
