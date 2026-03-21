/**
 * Pipeline Skill 1 — Step 1: Upload PDF to LlamaParse, return job_id immediately.
 *
 * POST { slug: string }
 *   - Downloads PDF from Supabase Storage at "{slug}/benefits-guide.pdf"
 *   - Uploads to LlamaParse, gets job_id
 *   - Saves job_id to pipeline_jobs table
 *   - Returns immediately (Vercel Hobby safe — no polling loop)
 *
 * Polling is handled by GET /api/pipeline/parse/status?slug=
 */

import { NextResponse } from 'next/server'
import { downloadAsBuffer, pdfPath, isSupabaseConfigured } from '@/lib/supabase/storage'
import { saveParseJob } from '@/lib/supabase/pipeline-store'

const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'LLAMA_CLOUD_API_KEY is not set.' }, { status: 500 })
    }
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 500 })
    }

    const body = await request.json() as { slug?: string }
    const slug = body.slug?.trim()
    if (!slug) {
      return NextResponse.json({ error: 'Missing required field: slug' }, { status: 400 })
    }

    // 1. Download PDF from Supabase Storage
    const storagePath = pdfPath(slug)
    console.log(`[pipeline/parse] Downloading PDF for ${slug} from ${storagePath}`)
    const buffer = await downloadAsBuffer(storagePath)
    console.log(`[pipeline/parse] PDF loaded (${Math.round(buffer.length / 1024)}KB). Uploading to LlamaParse...`)

    // 2. Upload to LlamaParse — get job_id immediately, do NOT poll
    const formData = new FormData()
    formData.append('file', new Blob([buffer], { type: 'application/pdf' }), 'benefits-guide.pdf')

    const uploadRes = await fetch(`${LLAMA_API_BASE}/api/v1/parsing/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    })
    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      throw new Error(`LlamaParse upload failed (${uploadRes.status}): ${err}`)
    }
    const { id: jobId } = (await uploadRes.json()) as { id: string }
    console.log(`[pipeline/parse] LlamaParse job started: ${jobId}`)

    // 3. Save job_id to pipeline_jobs table
    await saveParseJob(slug, jobId)

    return NextResponse.json({
      success: true,
      slug,
      jobId,
      status: 'processing',
      message: `PDF uploaded to LlamaParse. Job ID: ${jobId}. Poll /api/pipeline/parse/status?slug=${slug} to check progress.`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parse failed'
    console.error('[pipeline/parse]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
