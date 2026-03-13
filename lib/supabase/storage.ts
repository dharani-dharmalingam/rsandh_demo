/**
 * Supabase Storage helpers for employer PDFs and logos.
 * Bucket: employer-assets (public)
 * Paths: {slug}/benefits-guide.pdf, {slug}/logo.{ext}
 */

import { supabaseAdmin, isSupabaseConfigured as checkSupabase } from './server'

export { isSupabaseConfigured } from './server'

const BUCKET = 'employer-assets'

/** Storage path for PDF: used as fileAssetId in Phase 1/2. */
export function pdfPath(slug: string): string {
  return `${slug}/benefits-guide.pdf`
}

/** Storage path for logo. */
export function logoPath(slug: string, ext = 'png'): string {
  return `${slug}/logo.${ext}`
}

/** Public URL for a file in the bucket (for use in content JSON). */
export function getPublicUrl(storagePath: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return ''
  const base = url.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

/** Upload PDF to Supabase; returns storage path (e.g. rs-h/benefits-guide.pdf). */
export async function uploadPdf(slug: string, buffer: Buffer): Promise<string> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  }
  const path = pdfPath(slug)
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'application/pdf', upsert: true })
  if (error) throw new Error(`Supabase upload failed: ${error.message}`)
  return path
}

/** Upload logo to Supabase; returns storage path. */
export async function uploadLogo(slug: string, buffer: Buffer, mimeType: string): Promise<string> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg' : 'png'
  const path = logoPath(slug, ext)
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true })
  if (error) throw new Error(`Supabase logo upload failed: ${error.message}`)
  return path
}

/** Download file from Supabase as Buffer (for Phase 2 extraction). */
export async function downloadAsBuffer(storagePath: string): Promise<Buffer> {
  if (!checkSupabase() || !supabaseAdmin) {
    throw new Error('Supabase is not configured.')
  }
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(storagePath)
  if (error) throw new Error(`Supabase download failed: ${error.message}`)
  if (!data) throw new Error('No data returned from Supabase')
  return Buffer.from(await data.arrayBuffer())
}
