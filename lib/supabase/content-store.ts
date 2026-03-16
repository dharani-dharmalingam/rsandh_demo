/**
 * Store generated content and admin drafts in a Supabase table (cheap, fast).
 * Used by serverless: extraction → Git; admin Save Draft → table; admin Publish → Git.
 *
 * Table: content_drafts (slug PK, content jsonb, is_draft boolean, updated_at timestamptz)
 * Run scripts/supabase-content-drafts-table.sql once in Supabase SQL Editor.
 */

import { supabaseAdmin, isSupabaseConfigured as checkSupabase } from './server'

export const CONTENT_DRAFTS_TABLE = 'content_drafts'

export interface ContentDraftRow {
  slug: string
  content: object
  is_draft: boolean
  updated_at: string
}

/**
 * Upsert content (extraction pipeline). Sets is_draft=false.
 */
export async function upsertContentJson(slug: string, content: object): Promise<string> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const { error } = await supabaseAdmin
    .from(CONTENT_DRAFTS_TABLE)
    .upsert(
      {
        slug,
        content,
        is_draft: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
  if (error) throw new Error(`Supabase content_drafts upsert failed: ${error.message}`)
  return slug
}

/**
 * Save admin draft (serverless). Sets is_draft=true.
 */
export async function upsertDraft(slug: string, content: object): Promise<string> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const { error } = await supabaseAdmin
    .from(CONTENT_DRAFTS_TABLE)
    .upsert(
      {
        slug,
        content,
        is_draft: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
  if (error) throw new Error(`Supabase content_drafts upsert failed: ${error.message}`)
  return slug
}

/**
 * Get draft content by slug (is_draft=true). Returns null if none.
 */
export async function getDraft(slug: string): Promise<object | null> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const { data, error } = await supabaseAdmin
    .from(CONTENT_DRAFTS_TABLE)
    .select('content')
    .eq('slug', slug)
    .eq('is_draft', true)
    .maybeSingle()
  if (error) throw new Error(`Supabase content_drafts select failed: ${error.message}`)
  return data?.content ?? null
}

/**
 * Whether a draft exists for this slug (is_draft=true).
 */
export async function hasDraftInTable(slug: string): Promise<boolean> {
  if (!checkSupabase() || !supabaseAdmin) return false
  const { data, error } = await supabaseAdmin
    .from(CONTENT_DRAFTS_TABLE)
    .select('slug')
    .eq('slug', slug)
    .eq('is_draft', true)
    .maybeSingle()
  return !error && data != null
}

/**
 * Mark draft as published after Git commit (set is_draft=false).
 */
export async function markPublished(slug: string, content: object): Promise<void> {
  if (!checkSupabase() || !supabaseAdmin) return
  await supabaseAdmin
    .from(CONTENT_DRAFTS_TABLE)
    .upsert(
      {
        slug,
        content,
        is_draft: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'slug' }
    )
}

/**
 * Get stored content by slug (any; for retry-commit or cron).
 */
export async function getContentJson(slug: string): Promise<object | null> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const { data, error } = await supabaseAdmin
    .from(CONTENT_DRAFTS_TABLE)
    .select('content')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(`Supabase content_drafts select failed: ${error.message}`)
  return data?.content ?? null
}
