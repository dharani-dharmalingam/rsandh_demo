/**
 * Pipeline Skill 2 — Read markdown from parsed_documents table.
 *
 * GET ?slug={slug}
 *   Returns the full markdown Claude needs to analyze for extraction.
 *
 * POST { slug, extracted_data }
 *   Saves ExtractedBenefitsData (after Claude's LLM extraction) to extracted_documents.
 */

import { NextResponse } from 'next/server'
import { getParsedMarkdown, saveExtractedData, getExtractedData } from '@/lib/supabase/pipeline-store'
import type { ExtractedBenefitsData } from '@/lib/benefits-import/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')?.trim()
  const view = searchParams.get('view')

  if (!slug) {
    return NextResponse.json({ error: 'Missing query param: slug' }, { status: 400 })
  }

  // ?view=extracted — return extracted_documents for debugging
  if (view === 'extracted') {
    const extracted = await getExtractedData(slug)
    if (!extracted) {
      return NextResponse.json({ error: `No extracted data found for "${slug}"` }, { status: 404 })
    }
    return NextResponse.json({ success: true, slug, extracted_data: extracted })
  }

  const result = await getParsedMarkdown(slug)
  if (!result) {
    return NextResponse.json(
      { error: `No parsed markdown found for slug "${slug}". Run Skill 1 first.` },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    slug,
    markdown: result.markdown,
    wordCount: result.wordCount,
    storagePath: result.storagePath,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { slug?: string; extracted_data?: ExtractedBenefitsData }
    const { slug, extracted_data } = body

    if (!slug?.trim() || !extracted_data) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, extracted_data' },
        { status: 400 }
      )
    }

    if (!extracted_data.companyName || !Array.isArray(extracted_data.chapters) || extracted_data.chapters.length === 0) {
      return NextResponse.json(
        { error: 'Invalid extracted_data: must have non-empty companyName and chapters[]' },
        { status: 400 }
      )
    }

    await saveExtractedData(slug.trim(), extracted_data)
    console.log(`[pipeline/parsed] Saved extracted_data to extracted_documents for slug: ${slug}`)

    return NextResponse.json({
      success: true,
      slug,
      chaptersCount: extracted_data.chapters.length,
      companyName: extracted_data.companyName,
      nextStep: `Extracted data saved. Review the chapter list above, then say: "publish ${slug}"`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save extracted data failed'
    console.error('[pipeline/parsed]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
