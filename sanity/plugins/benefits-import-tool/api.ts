/**
 * Client-side helper to call the benefits-import API.
 * Used by the Studio tool; actual secrets stay on the server.
 */

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

