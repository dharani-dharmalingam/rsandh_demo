/**
 * Phase 2 -- Extract values with confirmed plans -> transform -> save as local content file.
 * POST with JSON body: { fileAssetId, clientSlug, logoAssetId?, confirmedPlans, companyName?, themeColor? }
 *
 * fileAssetId is either a Supabase storage path (e.g. rs-h/benefits-guide.pdf) or a local filename.
 */

import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { extractWithConfirmedPlans } from '@/lib/benefits-import/extract'
import { transformToSanitySchema } from '@/lib/benefits-import/transform'
import { seedPayloadToLocalContent } from '@/lib/benefits-import/to-local-content'
import { saveContent, publishContent, isContentWrittenToTmp } from '@/lib/content'
import { isSupabaseConfigured, getPublicUrl, downloadAsBuffer } from '@/lib/supabase/storage'
import { upsertContentJson } from '@/lib/supabase/content-store'
import { commitContentToGit } from '@/lib/git-commit'
import type { DetectedPlans, CustomTemplateDefinition } from '@/lib/benefits-import/types'

export const maxDuration = 300

const UPLOADS_DIR = path.join(process.cwd(), 'content', 'uploads')

export async function POST(request: Request) {
  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'LLAMA_CLOUD_API_KEY is not set in environment variables.' },
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

    const useSupabase = isSupabaseConfigured()

    let buffer: Buffer
    if (useSupabase) {
      buffer = await downloadAsBuffer(fileAssetId)
      console.log(`[benefits-import] Phase 2: PDF loaded from Supabase ${fileAssetId} (${Math.round(buffer.length / 1024)}KB)`)
    } else {
      const filePath = path.join(UPLOADS_DIR, fileAssetId)
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: `PDF file not found: ${fileAssetId}` },
          { status: 404 }
        )
      }
      buffer = fs.readFileSync(filePath)
      console.log(`[benefits-import] Phase 2: PDF loaded from ${filePath} (${Math.round(buffer.length / 1024)}KB)`)
    }

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

    console.log(`[benefits-import] Transforming extracted data for client: ${clientSlug}...`)
    const payload = await transformToSanitySchema(extractedData, clientSlug)
    console.log(`[benefits-import] Transformation complete.`)

    const localContent = seedPayloadToLocalContent(payload)

    if (logoAssetId) {
      localContent.siteSettings.clientLogo = useSupabase
        ? getPublicUrl(logoAssetId)
        : `/content/uploads/${logoAssetId}`
    }
    if (fileAssetId) {
      localContent.openEnrollment.benefitsGuideUrl = useSupabase
        ? getPublicUrl(fileAssetId)
        : `/content/uploads/${fileAssetId}`
    }

    const usedTmp = isContentWrittenToTmp()

    if (usedTmp) {
      // Serverless: no local disk. Upload to Supabase and commit to Git.
      let gitResult: { success: boolean; message: string } | null = null
      if (isSupabaseConfigured()) {
        try {
          await upsertContentJson(clientSlug, localContent)
          console.log(`[benefits-import] Content stored in Supabase table content_drafts for ${clientSlug}`)
          gitResult = await commitContentToGit(clientSlug, localContent)
          if (gitResult.success) {
            console.log(`[benefits-import] Content committed to Git: ${gitResult.message}`)
          } else {
            console.warn(`[benefits-import] Git commit skipped or failed: ${gitResult.message}`)
          }
        } catch (uploadOrCommitErr) {
          console.error('[benefits-import] Supabase upload or Git commit error:', uploadOrCommitErr)
          gitResult = {
            success: false,
            message: uploadOrCommitErr instanceof Error ? uploadOrCommitErr.message : 'Upload or commit failed',
          }
        }
      }
      const message = gitResult?.success
        ? `Site content generated for client "${clientSlug}" and committed to the repo. Deployment will run automatically.`
        : gitResult?.message ?? `Site content generated for client "${clientSlug}". Download the JSON below and add it to your repo, or set GITHUB_TOKEN and GITHUB_REPO to enable auto-commit.`
      return NextResponse.json({
        success: true,
        message,
        chaptersCount: localContent.benefitChapters.length,
        committedToGit: gitResult?.success ?? false,
        generatedContent: localContent,
        filename: `${clientSlug}.published.json`,
      })
    }

    saveContent(clientSlug, localContent)
    publishContent(clientSlug)
    console.log(`[benefits-import] Content saved and published for client: ${clientSlug}`)

    return NextResponse.json({
      success: true,
      message: `Site content generated for client "${clientSlug}".`,
      chaptersCount: localContent.benefitChapters.length,
      generatedContent: localContent,
      filename: `${clientSlug}.published.json`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Phase 2 extraction failed'
    console.error('[benefits-import]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
