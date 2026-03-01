/**
 * Stage 2 – Structured extraction data + clientSlug → Sanity seed payload.
 *
 * Since LlamaExtract returns structured data matching our schema,
 * this is primarily a field-mapping layer that adds Sanity-specific
 * metadata (_id, _type, _key, references, slugs).
 */

import type { ExtractedBenefitsData } from './types'
import type { SanitySeedPayload } from '../seedClient'

/**
 * Convert an array of plain-text paragraphs into Sanity Portable Text blocks.
 */
export function textToBlocks(paragraphs: string[]): SanitySeedPayload['benefitChapters'][0]['content'] {
  return paragraphs.map((text, i) => ({
    _type: 'block' as const,
    _key: `block-${i}`,
    style: 'normal' as const,
    children: [{ _type: 'span' as const, _key: `span-${i}`, text, marks: [] }],
    markDefs: [],
  }))
}

/**
 * Generate a short deterministic prefix from the client slug for document IDs.
 */
function slugPrefix(clientSlug: string): string {
  return clientSlug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .map((s) => s.slice(0, 2))
    .join('')
    .slice(0, 8) || 'client'
}

/**
 * Create a URL-safe slug from a title string.
 */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'untitled'
}

/**
 * Map extracted category to a feather icon name for the benefit chapter.
 */
const CATEGORY_ICON_MAP: Record<string, string> = {
  eligibility: 'check-circle',
  medical: 'heart',
  hdhp: 'shield',
  hmo: 'heart',
  ppo: 'heart',
  dental: 'smile',
  vision: 'eye',
  'fsa-hsa': 'dollar-sign',
  'hsa': 'dollar-sign',
  eap: 'users',
  supplemental: 'plus-circle',
  disability: 'briefcase',
  'life-insurance': 'umbrella',
  retirement: 'trending-up',
  'pet-insurance': 'paw-print',
  'college-savings': 'graduation-cap',
  wellness: 'activity',
  'paid-time-off': 'calendar',
  'voluntary-benefits': 'gift',
  'overview': 'list',
  other: 'file-text',
}

const CATEGORY_ALIASES: Record<string, string> = {
  'health savings': 'fsa-hsa',
  'flexible spending': 'fsa-hsa',
  'hsa': 'fsa-hsa',
  'fsa': 'fsa-hsa',
  'life and add': 'life-insurance',
  'life insurance': 'life-insurance',
  'survivor': 'life-insurance',
  'income protection': 'disability',
  'short-term disability': 'disability',
  'long-term disability': 'disability',
  'employee assistance': 'eap',
  'mental health': 'eap',
  'pet': 'pet-insurance',
  '529': 'college-savings',
  'pto': 'paid-time-off',
  'paid time off': 'paid-time-off',
  'voluntary': 'voluntary-benefits',
}

function normalizeCategory(raw: string): string {
  const lower = raw.toLowerCase().trim()
  if (CATEGORY_ICON_MAP[lower]) return lower
  for (const [alias, category] of Object.entries(CATEGORY_ALIASES)) {
    if (lower.includes(alias)) return category
  }
  return 'other'
}

/**
 * Transform structured LlamaExtract data into a Sanity seed payload.
 */
export async function transformToSanitySchema(
  extracted: ExtractedBenefitsData,
  clientSlug: string
): Promise<SanitySeedPayload> {
  const slug = clientSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'client'
  const clientId = `client-${slug}`
  const clientRef = { _type: 'reference' as const, _ref: clientId }
  const prefix = slugPrefix(slug)

  // Use extracted company name or derive from slug
  const displayName = extracted.companyName ||
    slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')

  // ── Benefit Chapters ──
  const benefitChapters = extracted.chapters.slice(0, 20).map((ch, i) => {
    const chapterSlug = toSlug(ch.title).slice(0, 96)
    const category = normalizeCategory(ch.category)
    const icon = CATEGORY_ICON_MAP[category] ?? CATEGORY_ICON_MAP['other']

    // ── Content Transformation ──
    // Combine introductory paragraphs and structured sections into one Portable Text array
    const contentBlocks: any[] = textToBlocks(
      ch.contentParagraphs?.length ? ch.contentParagraphs : [ch.description || ch.title]
    )

    if (ch.sections?.length) {
      ch.sections.forEach((section: any, sIdx: number) => {
        // Add H3 Header for the section
        contentBlocks.push({
          _type: 'block' as const,
          _key: `header-${sIdx}`,
          style: 'h3' as const,
          children: [{ _type: 'span' as const, _key: `span-h-${sIdx}`, text: section.title, marks: [] }],
          markDefs: [],
        })
        // Add paragraphs
        section.paragraphs.forEach((p: string, pIdx: number) => {
          contentBlocks.push({
            _type: 'block' as const,
            _key: `p-${sIdx}-${pIdx}`,
            style: 'normal' as const,
            children: [{ _type: 'span' as const, _key: `span-p-${sIdx}-${pIdx}`, text: p, marks: [] }],
            markDefs: [],
          })
        })
      })
    }

    const chapter: SanitySeedPayload['benefitChapters'][0] = {
      _id: `${prefix}-ch-${chapterSlug.slice(0, 30)}`,
      _type: 'benefitChapter' as const,
      client: clientRef,
      title: ch.title,
      slug: { _type: 'slug' as const, current: chapterSlug },
      description: ch.description?.slice(0, 200) ?? '',
      icon,
      order: i + 1,
      content: contentBlocks,
    }

    if (ch.planDetails?.length) {
      chapter.planDetails = ch.planDetails.map((table: any, tIdx: number) => ({
        _key: `table-${tIdx}`,
        tableTitle: table.tableTitle,
        ...(table.tableDescription && { tableDescription: table.tableDescription }),
        ...(table.planColumns?.length && {
          planColumns: table.planColumns.map((col: any, cIdx: number) => ({
            _key: `col-${cIdx}`,
            planName: col.planName,
            ...(col.subtitle && { subtitle: col.subtitle }),
          })),
        }),
        rows: table.rows.map((pd: any, rIdx: number) => ({
          _key: `row-${rIdx}`,
          label: pd.label,
          ...(pd.description && { description: pd.description }),
          ...(pd.inNetwork && { inNetwork: pd.inNetwork }),
          ...(pd.outOfNetwork && { outOfNetwork: pd.outOfNetwork }),
          ...(pd.frequency && { frequency: pd.frequency }),
          ...(pd.isSection && { isSection: pd.isSection }),
          ...(pd.spanColumns && { spanColumns: pd.spanColumns }),
          ...(pd.planValues?.length && {
            planValues: pd.planValues.map((pv: any, pvIdx: number) => ({
              _key: `pv-${pvIdx}`,
              inNetwork: pv.inNetwork || '—',
              outOfNetwork: pv.outOfNetwork || '—',
            })),
          }),
        })),
      }))
    }


    // Map dynamicTables with _key fields
    if (ch.dynamicTables?.length) {
      chapter.dynamicTables = ch.dynamicTables.map((dt: any, dtIdx: number) => ({
        _key: `dt-${dtIdx}`,
        tableTitle: dt.tableTitle,
        ...(dt.tableDescription && { tableDescription: dt.tableDescription }),
        headers: dt.headers,
        rows: dt.rows.map((row: any, rIdx: number) => ({
          _key: `dtr-${rIdx}`,
          cells: row.cells.map((c: string) => c || '—'),
          ...(row.isSection && { isSection: row.isSection }),
        })),
      }))
    }

    // Map premiumTables with _key fields
    if (ch.premiumTables?.length) {
      chapter.premiumTables = ch.premiumTables.map((pt: any, j: number) => ({
        _key: `pt-${j}`,
        planName: pt.planName,
        sectionTitle: pt.sectionTitle,
        ...(pt.sectionDescription && { sectionDescription: pt.sectionDescription }),
        tiers: pt.tiers.map((t: any, k: number) => ({
          _key: `tier-${k}`,
          tierName: t.tierName,
          amount: t.amount,
        })),
      }))
    }

    return chapter
  })

  // ── Enrollment Checklist ──
  const checklistItems = (extracted.enrollmentChecklist ?? []).map((item, i) => ({
    _key: `step-${i + 1}`,
    step: i + 1,
    title: item.title,
    description: item.description,
  }))

  // ── Benefit Changes ──
  const changeItems = (extracted.benefitChanges ?? []).map((change, i) => ({
    _key: `change-${i + 1}`,
    type: (change.type === 'new' ? 'new' : 'update') as 'new' | 'update',
    title: change.title,
    description: change.description,
  }))

  // ── Contact Info ──
  const contactInfo = (extracted.contactInfo ?? []).map((c, i) => ({
    _key: `c-${i}`,
    label: c.label,
    value: c.value,
    ...(c.href && { href: c.href }),
    ...(c.groupNumber && { groupNumber: c.groupNumber }),
  }))




  // ── Retirement Planning ──
  let retirementPlanning: SanitySeedPayload['retirementPlanning'] = undefined
  if (extracted.retirementPlanning) {
    const rp = extracted.retirementPlanning
    retirementPlanning = {
      _id: `retirementPlanning-${prefix}`,
      _type: 'retirementPlanning',
      client: clientRef,
      heroTitle: rp.heroTitle,
      heroDescription: rp.heroDescription,
      featuresTitle: 'Your Retirement Benefits',
      features: rp.features.map((f, i) => ({
        _key: `f-${i}`,
        iconName: f.icon || 'trending-up',
        title: f.title,
        description: f.description,
      })),
      planningTitle: rp.planningTitle || 'Planning for your future',
      sections: rp.sections.map((s, i) => ({
        _key: `s-${i}`,
        title: s.title,
        content: s.content,
      })),
      ctaButtonText: rp.ctaButtonText || 'Learn More',
      heroVideoUrl: rp.heroVideoUrl,
    }
  }

  // ── Quick Access Cards (with smart defaults) ──
  let quickAccess = (extracted.quickAccess ?? []).map((item, i) => ({
    _key: `qa-${i}`,
    title: item.title,
    description: item.description,
    href: item.href,
    iconName: item.iconName || 'building',
  }))

  // If the PDF didn't produce quickAccess cards, auto-generate them
  if (quickAccess.length === 0) {
    quickAccess = [
      {
        _key: 'qa-contacts',
        title: 'Important Contact Information',
        description: 'Find phone numbers, policy numbers and email addresses for all your benefit providers.',
        href: `/${slug}/contacts`,
        iconName: 'phone',
      },
      {
        _key: 'qa-docs',
        title: 'Document Hub',
        description: 'Access your benefits guide, plan summaries, and enrollment forms.',
        href: `/${slug}/document-hub`,
        iconName: 'file-text',
      },
      {
        _key: 'qa-enroll',
        title: 'Enroll Now',
        description: 'Complete your benefit elections during the open enrollment period.',
        href: `/${slug}/enrollment-checklist`,
        iconName: 'clipboard-check',
      },
    ]
  }

  // ── Footer Quick Links (always use internal navigation) ──
  const defaultQuickLinks = [
    { _key: 'ql-0', label: 'Home', href: `/${slug}` },
    { _key: 'ql-1', label: 'Benefits', href: `/${slug}/benefits` },
    { _key: 'ql-2', label: 'Document Hub', href: `/${slug}/document-hub` },
    { _key: 'ql-3', label: 'Contacts', href: `/${slug}/contacts` },
  ]

  // Use extracted quickLinks only if they look like internal paths, otherwise use defaults
  const extractedLinks = (extracted.quickLinks ?? [])
  const quickLinks = extractedLinks.length > 0 && extractedLinks.some(l => l.href?.startsWith('/'))
    ? extractedLinks.map((link, i) => ({ _key: `ql-${i}`, label: link.label, href: link.href }))
    : defaultQuickLinks

  return {
    client: {
      _id: clientId,
      _type: 'client',
      name: displayName,
      slug: { _type: 'slug', current: slug },
      themeColor: extracted.themeColor || '#2563eb',
    },
    siteSettings: {
      _id: `siteSettings-${prefix}`,
      _type: 'siteSettings',
      client: clientRef,
      clientName: displayName,
      shortName: displayName,
      logoText: extracted.landingPage?.heroTitle ? `${displayName} ${extracted.landingPage.heroTitle}` : `${displayName} Benefits`,
      footerAbout: `Comprehensive benefits administration and support for the valued employees of ${displayName}.`,
      quickAccess,
      contactInfo,
      quickLinks,
      footerContactTitle: 'Contact',
      footerContactDescription: 'Have questions? Reach out to our support team.',
      copyrightText: `© ${new Date().getFullYear()} ${displayName}. All rights reserved.`,
    },

    benefitsPage: {
      _id: `benefitsPage-${prefix}`,
      _type: 'benefitsPage',
      client: clientRef,
      title: 'Your Benefits at a Glance',
      description: `Explore the complete range of benefits available to ${displayName} employees.`,
    },
    openEnrollment: {
      _id: `openEnrollment-${prefix}`,
      _type: 'openEnrollment',
      client: clientRef,
      title: extracted.landingPage?.heroTitle || 'Welcome to Open Enrollment',
      description: extracted.landingPage?.heroSubtitle || 'Review and update your benefits selections for the upcoming plan year.',
      daysLeftLabel: 'Days Left',
      periodLabel: 'Open Enrollment Period',
      statusTitle: 'Action Needed',
      statusDescription: 'Review and update your selections now',
      checklistLabel: 'Review Enrollment Checklist',
      checklistSubtext: 'Prepare for open enrollment',
      changesLabel: 'Discover Benefit Changes',
      changesSubtext: "What's new this year",
      enrollLabel: 'Enroll Now',
      enrollSubtext: 'Complete your enrollment',
    },
    benefitChapters,
    enrollmentChecklist: {
      _id: `enrollmentChecklist-${prefix}`,
      _type: 'enrollmentChecklist',
      client: clientRef,
      title: 'Enrollment Checklist',
      description: 'Use this step-by-step checklist to prepare for open enrollment.',
      items: checklistItems,
      ctaTitle: 'Ready to Enroll?',
      ctaDescription: "Once you've completed this checklist, you're ready to make your benefit elections.",
    },
    benefitChangesPage: {
      _id: `benefitChangesPage-${prefix}`,
      _type: 'benefitChangesPage',
      client: clientRef,
      title: "What's New This Year",
      description: 'Review the latest changes and improvements to your benefits package.',
      alertMessage: 'Review all changes before making your elections during open enrollment.',
      changes: changeItems,
      ctaTitle: 'Ready to Review Your Benefits?',
      ctaDescription: 'Contact HR for any questions.',
    },
    retirementPlanning,
  }
}
