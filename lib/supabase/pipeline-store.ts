/**
 * Supabase helpers for the Claude-driven PDF pipeline.
 *
 * Tables (run scripts/supabase-pipeline-tables.sql once):
 *   parsed_documents    — LlamaParse markdown  (Skill 1 → Skill 2)
 *   extracted_documents — ExtractedBenefitsData (Skill 2 → Skill 3)
 */

import { supabaseAdmin, isSupabaseConfigured as checkSupabase } from './server'
import type { ExtractedBenefitsData } from '@/lib/benefits-import/types'

// ── parsed_documents ──────────────────────────────────────────────────────────

export async function saveParsedMarkdown(
  slug: string,
  markdown: string,
  storagePath: string
): Promise<void> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const wordCount = markdown.split(/\s+/).filter(Boolean).length
  const { error } = await supabaseAdmin
    .from('parsed_documents')
    .upsert(
      { slug, markdown, storage_path: storagePath, word_count: wordCount, updated_at: new Date().toISOString() },
      { onConflict: 'slug' }
    )
  if (error) throw new Error(`parsed_documents upsert failed: ${error.message}`)
}

export async function getParsedMarkdown(slug: string): Promise<{ markdown: string; storagePath: string; wordCount: number } | null> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const { data, error } = await supabaseAdmin
    .from('parsed_documents')
    .select('markdown, storage_path, word_count')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(`parsed_documents select failed: ${error.message}`)
  if (!data) return null
  return { markdown: data.markdown, storagePath: data.storage_path, wordCount: data.word_count ?? 0 }
}

// ── pipeline_jobs (LlamaParse async tracking) ─────────────────────────────────

export async function saveParseJob(slug: string, llamaJobId: string): Promise<void> {
  if (!checkSupabase() || !supabaseAdmin) throw new Error('Supabase is not configured.')
  const { error } = await supabaseAdmin
    .from('pipeline_jobs')
    .upsert({ slug, llama_job_id: llamaJobId }, { onConflict: 'slug' })
  if (error) throw new Error(`pipeline_jobs upsert failed: ${error.message}`)
}

export async function getParseJob(slug: string): Promise<string | null> {
  if (!checkSupabase() || !supabaseAdmin) throw new Error('Supabase is not configured.')
  const { data, error } = await supabaseAdmin
    .from('pipeline_jobs')
    .select('llama_job_id')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(`pipeline_jobs select failed: ${error.message}`)
  return data?.llama_job_id ?? null
}

// ── extracted_documents ───────────────────────────────────────────────────────

export async function saveExtractedData(slug: string, extractedData: ExtractedBenefitsData): Promise<void> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const { error } = await supabaseAdmin
    .from('extracted_documents')
    .upsert(
      { slug, extracted_data: extractedData, updated_at: new Date().toISOString() },
      { onConflict: 'slug' }
    )
  if (error) throw new Error(`extracted_documents upsert failed: ${error.message}`)
}

export async function getExtractedData(slug: string): Promise<ExtractedBenefitsData | null> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const { data, error } = await supabaseAdmin
    .from('extracted_documents')
    .select('extracted_data')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(`extracted_documents select failed: ${error.message}`)
  return (data?.extracted_data as ExtractedBenefitsData) ?? null
}
