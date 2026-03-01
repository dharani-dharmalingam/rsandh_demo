/**
 * Stage 3 – Seeding: SanitySeedPayload → Sanity via createOrReplace.
 * Uses @sanity/client. Idempotent; safe re-runs per client.
 */

import { createClient } from '@sanity/client'

export interface PortableTextBlock {
  _type: 'block'
  _key: string
  style: 'normal' | 'h2' | 'h3'
  children: Array<{ _type: 'span'; _key: string; text: string; marks: string[] }>
  markDefs: unknown[]
}

export interface BenefitChapterPayload {
  _id: string
  _type: 'benefitChapter'
  client: { _type: 'reference'; _ref: string }
  title: string
  slug: { _type: 'slug'; current: string }
  description?: string
  icon?: string
  order: number
  content: PortableTextBlock[]
  planDetails?: Array<{
    _key: string
    tableTitle: string
    tableDescription?: string
    planColumns?: Array<{
      _key: string
      planName: string
      subtitle?: string
    }>
    rows: Array<{
      _key: string
      label: string
      description?: string
      inNetwork?: string
      outOfNetwork?: string
      frequency?: string
      isSection?: boolean
      spanColumns?: boolean
      planValues?: Array<{
        _key: string
        inNetwork: string
        outOfNetwork: string
      }>
    }>
  }>
  premiumTables?: Array<{
    _key: string
    planName: string
    sectionTitle: string
    sectionDescription?: string
    tiers: Array<{ _key: string; tierName: string; amount: string }>
  }>
  dynamicTables?: Array<{
    _key: string
    tableTitle: string
    tableDescription?: string
    headers: string[]
    rows: Array<{
      _key: string
      cells: string[]
      isSection?: boolean
    }>
  }>
}

export interface SanitySeedPayload {
  client: {
    _id: string
    _type: 'client'
    name: string
    slug: { _type: 'slug'; current: string }
    themeColor?: string
  }
  siteSettings: {
    _id: string
    _type: 'siteSettings'
    client: { _type: 'reference'; _ref: string }
    clientName: string
    shortName: string
    logoText: string
    footerAbout: string
    quickAccess: Array<{ _key: string; title: string; description: string; href: string; iconName?: string }>
    contactInfo: Array<{ _key: string; label: string; value: string; href?: string; groupNumber?: string }>
    quickLinks: Array<{ _key: string; label: string; href: string }>
    footerContactTitle?: string
    footerContactDescription?: string
    copyrightText: string
  }
  benefitsPage: {
    _id: string
    _type: 'benefitsPage'
    client: { _type: 'reference'; _ref: string }
    title: string
    description: string
  }
  openEnrollment: {
    _id: string
    _type: 'openEnrollment'
    client: { _type: 'reference'; _ref: string }
    title: string
    description: string
    daysLeftLabel: string
    periodLabel: string
    statusTitle: string
    statusDescription: string
    checklistLabel: string
    checklistSubtext: string
    changesLabel: string
    changesSubtext: string
    enrollLabel: string
    enrollSubtext: string
  }
  benefitChapters: BenefitChapterPayload[]
  enrollmentChecklist: {
    _id: string
    _type: 'enrollmentChecklist'
    client: { _type: 'reference'; _ref: string }
    title: string
    description: string
    items: Array<{ _key: string; step: number; title: string; description: string }>
    ctaTitle: string
    ctaDescription: string
  }
  benefitChangesPage: {
    _id: string
    _type: 'benefitChangesPage'
    client: { _type: 'reference'; _ref: string }
    title: string
    description: string
    alertMessage: string
    changes: Array<{ _key: string; type: 'new' | 'update'; title: string; description: string }>
    ctaTitle: string
    ctaDescription: string
  }
  retirementPlanning?: {
    _id: string
    _type: 'retirementPlanning'
    client: { _type: 'reference'; _ref: string }
    heroTitle: string
    heroDescription: string
    featuresTitle: string
    features: Array<{ _key: string; iconName: string; title: string; description: string }>
    planningTitle: string
    sections: Array<{ _key: string; title: string; content: string }>
    ctaButtonText: string
    heroVideoUrl?: string
  }
}

export type SeedClientOptions = {
  projectId: string
  dataset: string
  apiVersion: string
  token: string
}

/**
 * Validate payload has required top-level keys and client ref.
 */
function validatePayload(data: unknown): asserts data is SanitySeedPayload {
  if (!data || typeof data !== 'object') throw new Error('Invalid seed payload: not an object')
  const d = data as Record<string, unknown>
  const required = ['client', 'siteSettings', 'benefitsPage', 'openEnrollment', 'benefitChapters', 'enrollmentChecklist', 'benefitChangesPage'] as const
  for (const key of required) {
    if (!d[key] || typeof (d[key] as object) !== 'object') {
      throw new Error(`Invalid seed payload: missing or invalid "${key}"`)
    }
  }
  const client = d.client as { _id?: string; _type?: string }
  if (!client._id || client._type !== 'client') {
    throw new Error('Invalid seed payload: client must have _id and _type "client"')
  }
}

/**
 * Seed all documents for a client site. Uses createOrReplace for idempotency.
 * Order: client first, then all documents that reference it.
 */
export async function seedClientSite(
  data: SanitySeedPayload,
  options: SeedClientOptions
): Promise<{ created: string[] }> {
  validatePayload(data)

  const client = createClient({
    projectId: options.projectId,
    dataset: options.dataset,
    apiVersion: options.apiVersion,
    useCdn: false,
    token: options.token,
  })

  const created: string[] = []

  // Use a transaction for atomic batching — all documents are created in one API call
  const tx = client.transaction()

  tx.createOrReplace(data.client)
  created.push(data.client._id)

  tx.createOrReplace(data.siteSettings)
  created.push(data.siteSettings._id)

  tx.createOrReplace(data.benefitsPage)
  created.push(data.benefitsPage._id)

  tx.createOrReplace(data.openEnrollment)
  created.push(data.openEnrollment._id)

  for (const ch of data.benefitChapters) {
    tx.createOrReplace(ch)
    created.push(ch._id)
  }

  tx.createOrReplace(data.enrollmentChecklist)
  created.push(data.enrollmentChecklist._id)

  tx.createOrReplace(data.benefitChangesPage)
  created.push(data.benefitChangesPage._id)

  if (data.retirementPlanning) {
    tx.createOrReplace(data.retirementPlanning)
    created.push(data.retirementPlanning._id)
  }

  await tx.commit()

  return { created }
}
