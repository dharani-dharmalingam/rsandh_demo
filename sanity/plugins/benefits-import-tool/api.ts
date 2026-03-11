/**
 * Client-side helpers to call the benefits-import API (Phase 1 + Phase 2).
 * Used by the Studio tool; actual secrets stay on the server.
 */

import type { Phase1Result, DetectedPlans, CustomTemplateDefinition } from '@/lib/benefits-import/types'

// ── Phase 1: Detect Plans ──

export interface Phase1Response extends Phase1Result {
  success: boolean
  fileAssetId?: string
  logoAssetId?: string
  clientSlug?: string
  error?: string
}

export async function runPhase1(
  clientSlug: string,
  fileAssetId: string,
  logoAssetId?: string,
  baseUrl: string = ''
): Promise<Phase1Response> {
  const formData = new FormData()
  formData.append('clientSlug', clientSlug.trim())
  formData.append('fileAssetId', fileAssetId)
  if (logoAssetId) {
    formData.append('logoAssetId', logoAssetId)
  }

  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  const res = await fetch(`${origin}/api/benefits-import`, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      success: false,
      error: data?.error || `Phase 1 failed (${res.status})`,
      detectedPlans: { medicalPlans: [], dentalPlans: [], visionPlans: [], premiumTiers: [] },
      chaptersList: [],
      companyName: '',
    }
  }
  return {
    success: true,
    detectedPlans: data.detectedPlans,
    chaptersList: data.chaptersList || [],
    companyName: data.companyName || '',
    themeColor: data.themeColor,
    fileAssetId: data.fileAssetId,
    logoAssetId: data.logoAssetId,
    clientSlug: data.clientSlug,
  }
}

// ── Phase 2: Extract + Seed ──

export interface Phase2Response {
  success: boolean
  message?: string
  created?: string[]
  error?: string
}

export async function runPhase2(
  fileAssetId: string,
  clientSlug: string,
  confirmedPlans: DetectedPlans,
  logoAssetId?: string,
  companyName?: string,
  themeColor?: string,
  baseUrl: string = '',
  chaptersList: string[] = [],
  templateIds?: string[],
  customTemplates?: CustomTemplateDefinition[]
): Promise<Phase2Response> {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  const res = await fetch(`${origin}/api/benefits-import/phase2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileAssetId,
      clientSlug,
      logoAssetId,
      confirmedPlans,
      companyName,
      themeColor,
      chaptersList,
      templateIds,
      customTemplates,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: data?.error || `Phase 2 failed (${res.status})` }
  }
  return { success: true, message: data?.message, created: data?.created }
}

// ── Legacy (backward-compatible) ──

export interface BenefitsImportResult {
  success: boolean
  message?: string
  created?: string[]
  error?: string
}

export async function runBenefitsImport(
  clientSlug: string,
  fileAssetId: string,
  logoAssetId?: string,
  baseUrl: string = ''
): Promise<BenefitsImportResult> {
  const formData = new FormData()
  formData.append('clientSlug', clientSlug.trim())
  formData.append('fileAssetId', fileAssetId)
  if (logoAssetId) {
    formData.append('logoAssetId', logoAssetId)
  }

  const res = await fetch(`${baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/api/benefits-import`, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: data?.error || `Request failed (${res.status})` }
  }
  return { success: true, message: data?.message, created: data?.created }
}
