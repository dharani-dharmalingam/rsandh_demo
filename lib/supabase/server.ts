import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  console.warn('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

/** Server-only Supabase client with service role (bypasses RLS). Use for uploads in API routes. */
export const supabaseAdmin = url && serviceRoleKey
  ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  : null

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceRoleKey && supabaseAdmin)
}
