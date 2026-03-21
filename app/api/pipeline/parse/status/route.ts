/**
 * Pipeline Skill 1 — Step 2: Check LlamaParse job status.
 *
 * GET ?slug=
 *   - Looks up job_id from pipeline_jobs table
 *   - Checks LlamaParse job status (single request, no polling loop)
 *   - If SUCCESS: fetches markdown, saves to parsed_documents, returns preview
 *   - If PENDING/RUNNING: returns { status: 'processing' }
 *   - If ERROR: returns error details
 *
 * Claude calls this repeatedly every ~5s until status = 'done'.
 * Each call is well under 10s — Vercel Hobby safe.
 */

import { NextResponse } from 'next/server'
import { getParseJob } from '@/lib/supabase/pipeline-store'
import { saveParsedMarkdown } from '@/lib/supabase/pipeline-store'
import { pdfPath, isSupabaseConfigured } from '@/lib/supabase/storage'

const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai'

export async function GET(request: Request) {
  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'LLAMA_CLOUD_API_KEY is not set.' }, { status: 500 })
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')?.trim()
    if (!slug) {
      return NextResponse.json({ error: 'Missing query param: slug' }, { status: 400 })
    }

    // 1. Get the LlamaParse job_id from DB
    const jobId = await getParseJob(slug)
    if (!jobId) {
      return NextResponse.json(
        { error: `No parse job found for "${slug}". Run POST /api/pipeline/parse first.` },
        { status: 404 }
      )
    }

    // 2. Single status check — no polling loop (Hobby safe)
    const statusRes = await fetch(`${LLAMA_API_BASE}/api/v1/parsing/job/${jobId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!statusRes.ok) {
      throw new Error(`LlamaParse status check failed: ${statusRes.status}`)
    }
    const job = (await statusRes.json()) as { status: string; error?: string }

    if (job.status === 'PENDING' || job.status === 'RUNNING') {
      return NextResponse.json({ status: 'processing', jobId, slug })
    }

    if (job.status === 'ERROR') {
      return NextResponse.json(
        { error: `LlamaParse job failed: ${job.error ?? 'unknown error'}`, jobId },
        { status: 500 }
      )
    }

    // 3. Job SUCCESS — fetch markdown and save to DB
    const resultRes = await fetch(`${LLAMA_API_BASE}/api/v1/parsing/job/${jobId}/result/markdown`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!resultRes.ok) {
      throw new Error(`LlamaParse result fetch failed: ${resultRes.status}`)
    }
    const { markdown } = (await resultRes.json()) as { markdown: string }

    const storagePath = pdfPath(slug)
    await saveParsedMarkdown(slug, markdown, storagePath)
    console.log(`[pipeline/parse/status] Markdown saved to parsed_documents for: ${slug}`)

    const wordCount = markdown.split(/\s+/).filter(Boolean).length
    const sectionCount = (markdown.match(/^##\s/gm) ?? []).length
    const preview = markdown.slice(0, 600).trimEnd()

    return NextResponse.json({
      status: 'done',
      slug,
      jobId,
      wordCount,
      sectionCount,
      storagePath,
      preview,
      nextStep: `Markdown saved. Review the preview above, then say: "extract variables for ${slug}"`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Status check failed'
    console.error('[pipeline/parse/status]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
