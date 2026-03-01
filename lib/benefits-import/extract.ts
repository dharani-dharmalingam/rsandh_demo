/**
 * Stage 1 – PDF → LlamaExtract → Structured JSON.
 * Server-side only. Uses LLAMA_CLOUD_API_KEY.
 *
 * TWO-PHASE EXTRACTION:
 * Phase 1: Detect plan names and counts (lightweight)
 * Phase 2: Extract values using templates for known chapters + dynamic for others
 */

import type { ExtractedBenefitsData, DetectedPlans } from './types'
import { TABLE_TEMPLATES, isTemplatedCategory, buildTableDescription } from './tableTemplates'
import type { TemplateRow } from './tableTemplates'

const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai'

export type ExtractOptions = {
  apiKey: string
  pollIntervalMs?: number
  maxWaitMs?: number
}

// ── Phase 1: Plan Detection Schema ──

const PLAN_DETECTION_SCHEMA = {
  type: 'object',
  description: 'Detect all plan names mentioned in this benefits guide. Extract ONLY the plan names and types — do not extract benefits details.',
  properties: {
    companyName: {
      type: 'string',
      description: 'The name of the company or organization whose benefits guide this is.',
    },
    themeColor: {
      type: 'string',
      description: 'The primary brand color of the company in hex format (e.g. #D31145). Extract from logos, headers, or dominant colors in the document. If not detectable, return null.',
    },
    medicalPlans: {
      type: 'array',
      description: 'Names of ALL distinct medical plan options. Extract ONLY the SHORT plan name used as a column header in premium/benefits tables (e.g., "PPO", "HDHP", "HMO", "EPO"). Do NOT include long descriptions or parentheticals. Do NOT duplicate — if a plan appears under multiple names, use only the shortest/simplest name.',
      items: { type: 'string' },
    },
    dentalPlans: {
      type: 'array',
      description: 'Names of ALL distinct dental plan options. Extract ONLY the SHORT plan name used as a column header in the dental comparison table (e.g., "Core Plan", "Enhanced Plan"). Do NOT include alternate names, former names, or parentheticals like "(formerly X)". If a plan appears under multiple names, use only ONE — the shortest name.',
      items: { type: 'string' },
    },
    visionPlans: {
      type: 'array',
      description: 'Names of ALL distinct vision plan options. Extract ONLY the SHORT plan name used as a column header in the vision comparison table (e.g., "Core VSP", "Enhanced VSP"). Do NOT include alternate names or parentheticals. If a plan appears under multiple names, use only ONE — the shortest name.',
      items: { type: 'string' },
    },
    premiumTiers: {
      type: 'array',
      description: 'Coverage tier names used in premium/contribution tables (e.g., "Associate", "Associate + spouse", "Employee Only", "Family"). Extract the EXACT tier names as written.',
      items: { type: 'string' },
    },
    chaptersList: {
      type: 'array',
      description: 'List ALL benefit section/chapter topics found in the document. Just the topic names — e.g., "Medical", "Dental", "Vision", "FSA", "HSA", "Life Insurance", "Disability", "EAP", "Eligibility", etc.',
      items: { type: 'string' },
    },
  },
  required: ['companyName', 'medicalPlans', 'dentalPlans', 'visionPlans'],
}

// ── Phase 2: Build dynamic extraction schema based on detected plans ──

function buildExtractionSchema(plans: DetectedPlans): Record<string, unknown> {
  const medicalPlanNames = plans.medicalPlans.length > 0 ? plans.medicalPlans : ['Plan']
  const dentalPlanNames = plans.dentalPlans.length > 0 ? plans.dentalPlans : ['Plan']
  const visionPlanNames = plans.visionPlans.length > 0 ? plans.visionPlans : ['Plan']

  // Build the medical plan value extraction for each plan
  const medicalPlanValueSchemas: Record<string, unknown> = {}
  for (const planName of medicalPlanNames) {
    const safeName = planName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    medicalPlanValueSchemas[`medical_${safeName}`] = {
      type: 'object',
      description: `Extract ALL values for the "${planName}" medical plan. If a value is not found, use "—".`,
      properties: {
        planOverview: { type: 'string', description: `Brief overview/description of the ${planName} medical plan.` },
        hsaEligible: { type: 'string', description: `Is this plan HSA eligible? e.g., "HSA eligible", "Not HSA eligible".` },
        premiums: {
          type: 'object',
          description: `Premium rates for ${planName}. Extract the EXACT dollar amounts.`,
          properties: Object.fromEntries(
            (plans.premiumTiers.length > 0
              ? plans.premiumTiers
              : ['Associate', 'Associate + spouse', 'Associate + child(ren)', 'Family']
            ).map(tier => [
              tier.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
              { type: 'string', description: `Premium amount for "${tier}" tier under ${planName}. e.g., "$159.98"` }
            ])
          ),
        },
        benefits: {
          type: 'object',
          description: `Plan Benefits Summary values for ${planName}. Extract EVERY value exactly as written.`,
          properties: {
            annual_deductible: { type: 'string', description: `Annual deductible for ${planName}. Include per-person and family if both exist. e.g., "$2,000 per person\\n$6,000 family maximum"` },
            out_of_pocket_maximum: { type: 'string', description: `Out-of-pocket maximum for ${planName}.` },
            coinsurance: { type: 'string', description: `Coinsurance (your share) for ${planName}. e.g., "20%"` },
            preventive_care: { type: 'string', description: `Preventive care coverage for ${planName}. e.g., "100% Covered"` },
            primary_physician_office_visit: { type: 'string', description: `Primary physician office visit cost for ${planName}. e.g., "$30 copay"` },
            specialist_office_visit: { type: 'string', description: `Specialist office visit cost for ${planName}.` },
            independent_labs: { type: 'string', description: `Independent labs cost for ${planName}.` },
            outpatient_xrays: { type: 'string', description: `Outpatient x-rays cost for ${planName}.` },
            imaging: { type: 'string', description: `Imaging (MRI, CT, PET, etc.) cost for ${planName}.` },
            convenience_clinic_visit: { type: 'string', description: `Convenience Clinic Visit cost for ${planName}.` },
            teladoc_virtual_visit: { type: 'string', description: `Teladoc Virtual Visit cost for ${planName}.` },
            urgent_care_center: { type: 'string', description: `Urgent Care Center cost for ${planName}.` },
            emergency_room: { type: 'string', description: `Emergency Room cost for ${planName}.` },
            inpatient_hospitalization: { type: 'string', description: `Inpatient Hospitalization cost for ${planName}.` },
            outpatient_surgery: { type: 'string', description: `Outpatient Surgery cost for ${planName}.` },
            // Out-of-network
            oon_annual_deductible: { type: 'string', description: `Out-of-network Annual Deductible for ${planName}.` },
            oon_coinsurance: { type: 'string', description: `Out-of-network Coinsurance for ${planName}.` },
            oon_out_of_pocket_maximum: { type: 'string', description: `Out-of-network Out-of-pocket maximum for ${planName}.` },
          },
        },
        prescriptionDrug: {
          type: 'object',
          description: `Prescription Drug Coverage values for ${planName}.`,
          properties: {
            preventive_medication: { type: 'string', description: `Preventive medication cost for ${planName}.` },
            pharmacy_deductible: { type: 'string', description: `Pharmacy deductible for ${planName}.` },
            retail_tier_one: { type: 'string', description: `Retail (30-day) Tier 1 cost for ${planName}.` },
            retail_tier_two: { type: 'string', description: `Retail (30-day) Tier 2 cost for ${planName}.` },
            retail_tier_three: { type: 'string', description: `Retail (30-day) Tier 3 cost for ${planName}.` },
            retail_speciality: { type: 'string', description: `Retail (30-day) Speciality cost for ${planName}.` },
            mailorder_tier_one: { type: 'string', description: `Mail order (90-day) Tier 1 cost for ${planName}.` },
            mailorder_tier_two: { type: 'string', description: `Mail order (90-day) Tier 2 cost for ${planName}.` },
            mailorder_tier_three: { type: 'string', description: `Mail order (90-day) Tier 3 cost for ${planName}.` },
            mailorder_speciality: { type: 'string', description: `Mail order (90-day) Speciality cost for ${planName}.` },
          },
        },
      },
    }
  }

  // Build dental values schema — per plan, in-network + out-of-network
  const dentalRowKeys = [
    'annual_deductible', 'annual_maximum', 'diagnostic_preventive_care',
    'basic_services', 'major_services', 'orthodontia', 'lifetime_maximum',
  ]
  const dentalValuesSchema: Record<string, unknown> = {}
  for (const planName of dentalPlanNames) {
    const safeName = planName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const props: Record<string, unknown> = {}
    for (const rowKey of dentalRowKeys) {
      props[`${rowKey}_in_network`] = { type: 'string', description: `In-network value for "${rowKey.replace(/_/g, ' ')}" under ${planName}.` }
      props[`${rowKey}_out_of_network`] = { type: 'string', description: `Out-of-network value for "${rowKey.replace(/_/g, ' ')}" under ${planName}.` }
    }
    dentalValuesSchema[`dental_${safeName}`] = {
      type: 'object',
      description: `Dental plan values for "${planName}". Extract In-network and Out-of-network values for each row.`,
      properties: props,
    }
  }

  // Build vision values schema — per plan, in-network + out-of-network
  const visionRowKeys = [
    'eye_exam', 'new_frames', 'single', 'bifocal', 'trifocal', 'elective', 'medically_necessary',
  ]
  const visionValuesSchema: Record<string, unknown> = {}
  for (const planName of visionPlanNames) {
    const safeName = planName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const props: Record<string, unknown> = {}
    for (const rowKey of visionRowKeys) {
      props[`${rowKey}_in_network`] = { type: 'string', description: `In-network value for "${rowKey.replace(/_/g, ' ')}" under ${planName}.` }
      props[`${rowKey}_out_of_network`] = { type: 'string', description: `Out-of-network value for "${rowKey.replace(/_/g, ' ')}" under ${planName}.` }
    }
    visionValuesSchema[`vision_${safeName}`] = {
      type: 'object',
      description: `Vision plan values for "${planName}". Extract In-network and Out-of-network values for each row.`,
      properties: props,
    }
  }

  // Build overview premium tiers
  const overviewSchema: Record<string, unknown> = {}
  const tierNames = plans.premiumTiers.length > 0
    ? plans.premiumTiers
    : ['Employee Only', 'Employee + Spouse', 'Employee + Child(ren)', 'Family']

  for (const benefitType of ['medical', 'dental', 'vision'] as const) {
    const planNames = benefitType === 'medical' ? medicalPlanNames
      : benefitType === 'dental' ? dentalPlanNames
        : visionPlanNames
    const tierProps: Record<string, unknown> = {}
    for (const planName of planNames) {
      for (const tier of tierNames) {
        const key = `${planName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${tier.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
        tierProps[key] = { type: 'string', description: `Premium for "${planName}" at "${tier}" coverage level. e.g., "$159.98"` }
      }
    }
    overviewSchema[`overview_${benefitType}_premiums`] = {
      type: 'object',
      description: `Bi-weekly premium contributions for all ${benefitType} plans by coverage tier.`,
      properties: tierProps,
    }
  }

  return {
    type: 'object',
    description: 'Extract ALL benefit information from this employee benefits guide. Use the structured fields below for each section.',
    properties: {
      companyName: {
        type: 'string',
        description: 'The name of the company.',
      },
      themeColor: {
        type: 'string',
        description: 'Primary brand color in hex format.',
      },
      landingPage: {
        type: 'object',
        properties: {
          heroTitle: { type: 'string', description: 'Main greeting on the homepage.' },
          heroSubtitle: { type: 'string', description: 'Subheader text.' },
          explainerVideo: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              url: { type: 'string' },
            },
          },
        },
      },
      retirementPlanning: {
        type: 'object',
        description: 'Details about retirement planning if mentioned.',
        properties: {
          heroTitle: { type: 'string' },
          heroDescription: { type: 'string' },
          features: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                icon: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
          planningTitle: { type: 'string' },
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
          ctaButtonText: { type: 'string' },
          heroVideoUrl: { type: 'string' },
        },
      },

      // ── Templated Values ──
      ...overviewSchema,
      ...medicalPlanValueSchemas,
      ...dentalValuesSchema,
      ...visionValuesSchema,

      // ── Dynamic Chapters (non-templated) ──
      dynamicChapters: {
        type: 'array',
        description: `Extract ALL benefit chapters NOT covered by the templated sections above. This includes FSA, HSA, Life Insurance, Disability/Income Protection, EAP, Eligibility, and any other benefit sections. For each chapter, extract ALL tables exactly as they appear in the PDF.

CRITICAL: Do NOT include Medical Plan, Dental Plan, Vision Plan, or Overview chapters here — those are handled by the templated sections above.`,
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: `Chapter title. Use standardized names:
- FSA content → "Flexible Spending Accounts (FSA)"
- HSA content → "Health Savings Account (HSA)"
- Combined FSA & HSA → "FSA & HSA"
- Life insurance → "Life Insurance"
- Disability/income protection → "Income Protection"
- EAP → "Employee Assistance Program (EAP)"
- Eligibility → "Eligibility & Qualifying Life Events"
- 401k/retirement → "Retirement Plan"
For other sections, use the exact heading from the document.`,
            },
            description: { type: 'string', description: '1-2 sentence summary.' },
            category: {
              type: 'string',
              description: 'One of: eligibility, fsa-hsa, hsa, eap, supplemental, disability, life-insurance, retirement, pet-insurance, college-savings, wellness, paid-time-off, voluntary-benefits, other.',
            },
            contentParagraphs: {
              type: 'array',
              description: 'Body text content broken into paragraphs.',
              items: { type: 'string' },
            },
            sections: {
              type: 'array',
              description: 'Sub-sections with headings.',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  paragraphs: { type: 'array', items: { type: 'string' } },
                },
              },
            },
            tables: {
              type: 'array',
              description: 'Extract ALL tables in this chapter exactly as they appear in the PDF. Use exact column headers and row values.',
              items: {
                type: 'object',
                properties: {
                  tableTitle: { type: 'string', description: 'Title of the table exactly as in the PDF.' },
                  tableDescription: { type: 'string', description: 'Optional description text above the table.' },
                  headers: {
                    type: 'array',
                    description: 'Column headers exactly as in the PDF. First header is the row label column.',
                    items: { type: 'string' },
                  },
                  rows: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        cells: {
                          type: 'array',
                          description: 'Cell values in the same order as headers. Use "—" for empty cells.',
                          items: { type: 'string' },
                        },
                        isSection: { type: 'boolean', description: 'Set true if this row is a section header.' },
                      },
                      required: ['cells'],
                    },
                  },
                },
                required: ['tableTitle', 'headers', 'rows'],
              },
            },
          },
          required: ['title', 'description', 'category', 'contentParagraphs'],
        },
      },

      // ── Non-table data ──
      enrollmentChecklist: {
        type: 'array',
        description: 'Step-by-step enrollment checklist items.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['title', 'description'],
        },
      },
      benefitChanges: {
        type: 'array',
        description: 'Changes or updates for the current plan year.',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', description: '"new" or "update".' },
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['type', 'title', 'description'],
        },
      },
      contactInfo: {
        type: 'array',
        description: 'Contact information found in the document.',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'string' },
            href: { type: 'string' },
            groupNumber: { type: 'string' },
          },
          required: ['label', 'value'],
        },
      },
      quickLinks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            href: { type: 'string' },
          },
          required: ['label', 'href'],
        },
      },
      quickAccess: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            href: { type: 'string' },
            iconName: { type: 'string' },
          },
          required: ['title', 'description', 'href'],
        },
      },
    },
    required: ['companyName'],
  }
}

// ── Plan Name Deduplication ──

/**
 * Remove duplicate/alias plan names. If two names are similar
 * (one is a substring of the other or they share the same core word),
 * keep the shorter/simpler one.
 *
 * Examples of deduplication:
 * - ["Core Plan (formerly Preferred Plan)", "Core Dental Plan"] → ["Core Plan", "Core Dental Plan"]
 *   ↳ But "Core Plan" vs "Core Dental Plan" are kept since neither is substring of other
 * - ["Core Plan", "Core Plan (formerly Preferred Plan)"] → ["Core Plan"]
 * - ["Enhanced VSP", "Enhanced VSP *"] → ["Enhanced VSP"]
 */
function deduplicatePlanNames(names: string[]): string[] {
  if (names.length <= 1) return names

  // Clean up names: strip parentheticals, trailing *, extra whitespace
  const cleaned = names.map(n => {
    const stripped = n
      .replace(/\s*\(.*?\)\s*/g, '')  // Remove (formerly ...), etc.
      .replace(/\s*\*+\s*$/, '')       // Remove trailing *
      .trim()
    return { original: n, clean: stripped }
  })

  // Deduplicate: if two cleaned names are the same, keep the shorter original
  const uniqueMap = new Map<string, string>()
  for (const { original, clean } of cleaned) {
    const key = clean.toLowerCase()
    if (!uniqueMap.has(key) || original.length < (uniqueMap.get(key)?.length ?? Infinity)) {
      uniqueMap.set(key, clean)
    }
  }

  const result = Array.from(uniqueMap.values())

  // Second pass: check for substring relationships (e.g., "PPO" vs "PPO Plan")
  const final: string[] = []
  for (const name of result) {
    const lowerName = name.toLowerCase()
    const isDuplicate = result.some(other => {
      if (other === name) return false
      const lowerOther = other.toLowerCase()
      // If the other name contains this name AND is shorter, this one is redundant
      return lowerOther.includes(lowerName) && other.length < name.length
    })
    if (!isDuplicate) {
      final.push(name)
    }
  }

  if (final.length !== names.length) {
    console.log(`[benefits-import] Deduplicated plan names: [${names.join(', ')}] → [${final.join(', ')}]`)
  }

  return final
}

// ── API Call Helpers ──


async function callLlamaExtract(
  pdfBuffer: Buffer,
  schema: Record<string, unknown>,
  apiKey: string,
  pollIntervalMs: number,
  maxWaitMs: number
): Promise<Record<string, unknown>> {
  const base64File = pdfBuffer.toString('base64')
  const extractUrl = `${LLAMA_API_BASE}/api/v1/extraction/run`

  const extractRes = await fetch(extractUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data_schema: schema,
      config: {
        extraction_target: 'PER_DOC',
        extraction_mode: 'BALANCED',
      },
      file: {
        data: base64File,
        mime_type: 'application/pdf',
      },
      file_name: 'benefits-guide.pdf',
    }),
  })

  if (!extractRes.ok) {
    const errText = await extractRes.text()
    throw new Error(`LlamaExtract request failed (${extractRes.status}): ${errText}`)
  }

  const result = await extractRes.json() as Record<string, unknown>

  // Handle async job response
  if (result.id || result.job_id) {
    const jobId = (result.id ?? result.job_id) as string
    console.log(`[benefits-import] LlamaExtract job started: ${jobId}`)
    return await pollForResults(jobId, apiKey, pollIntervalMs, maxWaitMs)
  }

  // Handle synchronous response
  if (result.data) return result.data as Record<string, unknown>
  if (result.companyName || result.chapters || result.medicalPlans) return result
  throw new Error('LlamaExtract returned an unexpected response format')
}

/**
 * Extract structured benefits data from a PDF using LlamaExtract.
 * Two-phase extraction: detect plans first, then extract values.
 */
export async function extractBenefitsGuide(
  pdfBuffer: Buffer,
  options: ExtractOptions
): Promise<ExtractedBenefitsData> {
  const { apiKey, pollIntervalMs = 5000, maxWaitMs = 600_000 } = options

  if (!apiKey?.trim()) {
    throw new Error('LLAMA_CLOUD_API_KEY is required for extraction')
  }

  // ── Phase 1: Detect Plans ──
  console.log('[benefits-import] Phase 1: Detecting plan names and counts...')
  const phase1Result = await callLlamaExtract(pdfBuffer, PLAN_DETECTION_SCHEMA, apiKey, pollIntervalMs, maxWaitMs)

  const unwrapped1 = (phase1Result as any).extraction ?? phase1Result
  const detectedPlans: DetectedPlans = {
    medicalPlans: deduplicatePlanNames(Array.isArray(unwrapped1.medicalPlans) ? unwrapped1.medicalPlans : []),
    dentalPlans: deduplicatePlanNames(Array.isArray(unwrapped1.dentalPlans) ? unwrapped1.dentalPlans : []),
    visionPlans: deduplicatePlanNames(Array.isArray(unwrapped1.visionPlans) ? unwrapped1.visionPlans : []),
    premiumTiers: Array.isArray(unwrapped1.premiumTiers) ? unwrapped1.premiumTiers : [],
  }

  console.log(
    `[benefits-import] Phase 1 complete: ${detectedPlans.medicalPlans.length} medical plans (${detectedPlans.medicalPlans.join(', ')}), ` +
    `${detectedPlans.dentalPlans.length} dental plans (${detectedPlans.dentalPlans.join(', ')}), ` +
    `${detectedPlans.visionPlans.length} vision plans (${detectedPlans.visionPlans.join(', ')}), ` +
    `${detectedPlans.premiumTiers.length} premium tiers`
  )

  // ── Phase 2: Extract Values ──
  console.log('[benefits-import] Phase 2: Extracting values with template-guided schema...')
  const phase2Schema = buildExtractionSchema(detectedPlans)
  const phase2Result = await callLlamaExtract(pdfBuffer, phase2Schema, apiKey, pollIntervalMs, maxWaitMs)

  const unwrapped2 = (phase2Result as any).extraction ?? phase2Result

  // ── Assemble into ExtractedBenefitsData ──
  return assembleExtractedData(unwrapped2, detectedPlans, unwrapped1)
}

/**
 * Assemble raw Phase 2 extraction results into the unified ExtractedBenefitsData format.
 */
function assembleExtractedData(
  raw: Record<string, any>,
  plans: DetectedPlans,
  phase1: Record<string, any>
): ExtractedBenefitsData {
  const companyName = raw.companyName || phase1.companyName || 'Unknown Company'
  const themeColor = raw.themeColor || phase1.themeColor

  const medicalPlanNames = plans.medicalPlans.length > 0 ? plans.medicalPlans : []
  const dentalPlanNames = plans.dentalPlans.length > 0 ? plans.dentalPlans : []
  const visionPlanNames = plans.visionPlans.length > 0 ? plans.visionPlans : []
  const tierNames = plans.premiumTiers.length > 0
    ? plans.premiumTiers
    : ['Employee Only', 'Employee + Spouse', 'Employee + Child(ren)', 'Family']

  const chapters: ExtractedBenefitsData['chapters'] = []

  // ── Overview Chapter ──
  const overviewTables: ExtractedBenefitsData['chapters'][0]['tables'] = []

  for (const benefitType of ['medical', 'dental', 'vision'] as const) {
    const planNames = benefitType === 'medical' ? medicalPlanNames
      : benefitType === 'dental' ? dentalPlanNames
        : visionPlanNames
    if (planNames.length === 0) continue

    const overviewKey = `overview_${benefitType}_premiums`
    const premiumData = raw[overviewKey] || {}

    // Build columns: one per plan
    const columns = planNames.map(pn => ({
      key: pn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
      label: pn,
    }))

    // Build rows: one per tier
    const rows = tierNames.map(tier => {
      const cells = planNames.map(pn => {
        const key = `${pn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${tier.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
        return premiumData[key] || '—'
      })
      return { label: tier, cells }
    })

    const template = TABLE_TEMPLATES['overview'].tables.find(t => t.templateId === `overview-${benefitType}`)
    overviewTables.push({
      templateId: `overview-${benefitType}`,
      tableTitle: template?.tableTitle || `${benefitType.charAt(0).toUpperCase() + benefitType.slice(1)} Plans`,
      tableDescription: template?.tableDescriptionTemplate,
      columns,
      rows,
    })
  }

  chapters.push({
    title: 'Overview of Available Plans',
    description: `Overview of all available benefit plans for ${companyName} employees.`,
    category: 'overview',
    contentParagraphs: [`Review and compare all benefit plans available to ${companyName} employees.`],
    tables: overviewTables,
  })

  // ── Medical Plan Chapters (one per plan) ──
  const medicalTemplate = TABLE_TEMPLATES['medical']
  for (const planName of medicalPlanNames) {
    const safeName = planName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const planData = raw[`medical_${safeName}`] || {}
    const premiums = planData.premiums || {}
    const benefits = planData.benefits || {}
    const rx = planData.prescriptionDrug || {}
    const hsaEligible = planData.hsaEligible || ''

    // Table 1: Premium Rates
    const premiumCols = [{ key: safeName, label: planName }]
    const premiumRows = tierNames.map(tier => ({
      label: tier,
      cells: [premiums[tier.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()] || '—'],
    }))

    // Table 2: Plan Benefits Summary
    const benefitKeyMap: Record<string, string> = {
      'Annual deductible': 'annual_deductible',
      'Out-of-pocket maximum': 'out_of_pocket_maximum',
      'Coinsurance (your share)': 'coinsurance',
      'Preventive care': 'preventive_care',
      'Primary physician office visit': 'primary_physician_office_visit',
      'Specialist office visit': 'specialist_office_visit',
      'Independent labs': 'independent_labs',
      'Outpatient x-rays': 'outpatient_xrays',
      'Imaging (MRI, CT, PET, etc.)': 'imaging',
      'Convenience Clinic Visit': 'convenience_clinic_visit',
      'Teladoc Virtual Visit': 'teladoc_virtual_visit',
      'Urgent Care Center': 'urgent_care_center',
      'Emergency Room': 'emergency_room',
      'Inpatient Hospitalization': 'inpatient_hospitalization',
      'Outpatient Surgery': 'outpatient_surgery',
      // Out-of-network
      'Annual Deductible': 'oon_annual_deductible',
      'Coinsurance (your share) ': 'oon_coinsurance',  // trailing space to differentiate
      'Out-of-pocket maximum ': 'oon_out_of_pocket_maximum',
    }

    const benefitCols = [{ key: safeName, label: `${planName} Plan (you pay)` }]
    const benefitTemplate = medicalTemplate.tables[1]
    const benefitRows = benefitTemplate.rows.map(row => {
      if (row.isSection) {
        return { label: row.label, cells: [], isSection: true }
      }
      // Check if we're in the out-of-network section
      const key = benefitKeyMap[row.label] || row.label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      return { label: row.label, cells: [benefits[key] || '—'] }
    })

    // Table 3: Prescription Drug Coverage
    const rxKeyMap: Record<string, string> = {
      'Preventive Medication': 'preventive_medication',
      'Pharmacy Deductible': 'pharmacy_deductible',
      'Tier one': 'retail_tier_one',     // Will be overridden in mail order section
      'Tier two': 'retail_tier_two',
      'Tier three': 'retail_tier_three',
      'Speciality': 'retail_speciality',
    }

    const rxCols = [{ key: safeName, label: 'Cost' }]
    const rxTemplate = medicalTemplate.tables[2]
    let inMailOrder = false
    const rxRows = rxTemplate.rows.map(row => {
      if (row.isSection) {
        if (row.label.toLowerCase().includes('mail order')) inMailOrder = true
        return { label: row.label, cells: [], isSection: true }
      }
      let key: string
      if (inMailOrder) {
        key = `mailorder_${row.label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
      } else {
        key = rxKeyMap[row.label] || `retail_${row.label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
      }
      return { label: row.label, cells: [rx[key] || '—'] }
    })

    const descParts = [`Comprehensive coverage details for ${planName} plan`]
    if (hsaEligible) descParts.push(`- ${hsaEligible}`)

    chapters.push({
      title: `${planName} Medical Plan`,
      description: planData.planOverview || `${planName} medical plan coverage details.`,
      category: 'medical',
      contentParagraphs: [planData.planOverview || `Detailed coverage information for the ${planName} medical plan.`],
      tables: [
        {
          templateId: 'medical-premiums',
          tableTitle: 'Premium Rates',
          tableDescription: buildTableDescription(medicalTemplate.tables[0].tableDescriptionTemplate || '', planName),
          columns: premiumCols,
          rows: premiumRows,
        },
        {
          templateId: 'medical-benefits',
          tableTitle: 'Plan Benefits Summary',
          tableDescription: descParts.join(' '),
          columns: benefitCols,
          rows: benefitRows,
        },
        {
          templateId: 'medical-rx',
          tableTitle: 'Prescription Drug Coverage',
          tableDescription: rxTemplate.tableDescriptionTemplate || '',
          columns: rxCols,
          rows: rxRows,
        },
      ],
    })
  }

  // ── Dental Chapter ──
  if (dentalPlanNames.length > 0) {
    const dentalCols = dentalPlanNames.flatMap(pn => [
      { key: `${pn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_in`, label: pn, subLabel: 'In-network' },
      { key: `${pn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_out`, label: pn, subLabel: 'Out-of-network' },
    ])

    const dentalRowKeys = [
      { label: 'Annual deductible (Individual/Family)', key: 'annual_deductible' },
      { label: 'Annual maximum (per person)', key: 'annual_maximum' },
      { label: 'Diagnostic and preventive care', key: 'diagnostic_preventive_care' },
      { label: 'Basic services', key: 'basic_services' },
      { label: 'Major services', key: 'major_services' },
      { label: 'Orthodontia*', key: 'orthodontia' },
      { label: 'Lifetime maximum', key: 'lifetime_maximum' },
    ]

    const dentalRows = dentalRowKeys.map(rowDef => {
      const cells = dentalPlanNames.flatMap(pn => {
        const safeName = pn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        const planData = raw[`dental_${safeName}`] || {}
        return [
          planData[`${rowDef.key}_in_network`] || '—',
          planData[`${rowDef.key}_out_of_network`] || '—',
        ]
      })
      return { label: rowDef.label, cells }
    })

    chapters.push({
      title: 'Dental Plan',
      description: 'Dental coverage options and benefits comparison.',
      category: 'dental',
      contentParagraphs: ['Compare dental plan options and their coverage details.'],
      tables: [{
        templateId: 'dental-benefits',
        tableTitle: 'Dental',
        columns: dentalCols,
        rows: dentalRows,
      }],
    })
  }

  // ── Vision Chapter ──
  if (visionPlanNames.length > 0) {
    const visionCols = visionPlanNames.flatMap(pn => [
      { key: `${pn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_in`, label: pn, subLabel: 'In-network' },
      { key: `${pn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_out`, label: pn, subLabel: 'Out-of-network' },
    ])

    const visionRowDefs = [
      { label: 'Eye Exam (every 12 months)', key: 'eye_exam' },
      { label: 'Frames', key: null, isSection: true },
      { label: 'New frames', key: 'new_frames' },
      { label: 'Lenses (every 12 months)', key: null, isSection: true },
      { label: 'Single', key: 'single' },
      { label: 'Bifocal', key: 'bifocal' },
      { label: 'Trifocal', key: 'trifocal' },
      { label: 'Contact lenses (every 12 months)', key: null, isSection: true },
      { label: 'Elective', key: 'elective' },
      { label: 'Medically necessary', key: 'medically_necessary' },
    ]

    const visionRows = visionRowDefs.map(rowDef => {
      if (rowDef.isSection) {
        return { label: rowDef.label, cells: [], isSection: true }
      }
      const cells = visionPlanNames.flatMap(pn => {
        const safeName = pn.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        const planData = raw[`vision_${safeName}`] || {}
        return [
          planData[`${rowDef.key}_in_network`] || '—',
          planData[`${rowDef.key}_out_of_network`] || '—',
        ]
      })
      return { label: rowDef.label, cells }
    })

    chapters.push({
      title: 'Vision Plan',
      description: 'Vision coverage options and benefits comparison.',
      category: 'vision',
      contentParagraphs: ['Compare vision plan options and their coverage details.'],
      tables: [{
        templateId: 'vision-benefits',
        tableTitle: 'Vision',
        columns: visionCols,
        rows: visionRows,
      }],
    })
  }

  // ── Dynamic Chapters ──
  const dynamicChapters = Array.isArray(raw.dynamicChapters) ? raw.dynamicChapters : []
  for (const dc of dynamicChapters) {
    if (!dc.title) continue

    const tables = (dc.tables || []).map((t: any) => {
      const headers: string[] = Array.isArray(t.headers) ? t.headers : []
      // Build columns from headers (first header is row label column, skip it)
      const columns = headers.slice(1).map((h: string, i: number) => ({
        key: `col-${i}`,
        label: h,
      }))

      const rows = (t.rows || []).map((r: any) => {
        const allCells: string[] = Array.isArray(r.cells) ? r.cells : []
        return {
          label: allCells[0] || '',
          cells: allCells.slice(1).map((c: string) => c || '—'),
          ...(r.isSection && { isSection: true }),
        }
      })

      return {
        tableTitle: t.tableTitle || '',
        tableDescription: t.tableDescription,
        columns,
        rows,
      }
    })

    chapters.push({
      title: dc.title,
      description: dc.description || dc.title,
      category: dc.category || 'other',
      contentParagraphs: Array.isArray(dc.contentParagraphs) ? dc.contentParagraphs : [dc.description || dc.title],
      sections: dc.sections,
      tables: tables.length > 0 ? tables : undefined,
    })
  }

  console.log(
    `[benefits-import] Assembled: "${companyName}" with ${chapters.length} chapters. ` +
    `Chapters: ${chapters.map(c => c.title).join(', ')}`
  )

  return {
    companyName,
    themeColor,
    landingPage: raw.landingPage,
    retirementPlanning: raw.retirementPlanning,
    chapters,
    detectedPlans: plans,
    enrollmentChecklist: raw.enrollmentChecklist,
    benefitChanges: raw.benefitChanges,
    contactInfo: raw.contactInfo,
    quickLinks: raw.quickLinks,
    quickAccess: raw.quickAccess,
  }
}

// ── Polling helpers (unchanged) ──

async function pollForResults(
  jobId: string,
  apiKey: string,
  pollIntervalMs: number,
  maxWaitMs: number
): Promise<Record<string, unknown>> {
  const start = Date.now()
  let lastStatus = ''
  let consecutiveErrors = 0
  const MAX_RETRIES = 3

  for (; ;) {
    const statusUrl = `${LLAMA_API_BASE}/api/v1/extraction/jobs/${jobId}`
    const statusRes = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!statusRes.ok) {
      const errBody = await statusRes.text().catch(() => '')
      console.warn(
        `[benefits-import] LlamaExtract poll error (${statusRes.status}): ${errBody.slice(0, 200)}`
      )
      if (statusRes.status >= 500 && consecutiveErrors < MAX_RETRIES) {
        consecutiveErrors++
        console.log(
          `[benefits-import] Retrying poll (${consecutiveErrors}/${MAX_RETRIES}) in ${pollIntervalMs}ms...`
        )
        await new Promise((r) => setTimeout(r, pollIntervalMs))
        continue
      }
      throw new Error(
        `LlamaExtract job status failed (${statusRes.status}) after ${consecutiveErrors} retries. ${errBody.slice(0, 200)}`
      )
    }

    consecutiveErrors = 0

    const statusData = (await statusRes.json()) as Record<string, unknown> & {
      status?: string
      state?: string
      error_message?: string
      result?: unknown
      data?: unknown
    }
    const status = (statusData.status ?? statusData.state ?? '').toString().toUpperCase()

    if (status !== lastStatus) {
      lastStatus = status
      console.log(
        `[benefits-import] LlamaExtract job ${jobId} status: ${status} (${Math.round((Date.now() - start) / 1000)}s)`
      )
    }

    if (status === 'COMPLETED' || status === 'DONE' || status === 'SUCCESS') {
      const data = statusData.result ?? statusData.data
      if (data) return data as Record<string, unknown>
      return await fetchJobResults(jobId, apiKey)
    }

    if (status === 'FAILED' || status === 'CANCELLED' || status === 'ERROR') {
      throw new Error(
        (statusData.error_message as string) ?? `LlamaExtract job ${status}`
      )
    }

    if (Date.now() - start > maxWaitMs) {
      throw new Error(
        `LlamaExtract job timed out after ${Math.round(maxWaitMs / 60000)} minutes.`
      )
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs))
  }
}

async function fetchJobResults(
  jobId: string,
  apiKey: string
): Promise<Record<string, unknown>> {
  const resultUrl = `${LLAMA_API_BASE}/api/v1/extraction/jobs/${jobId}/result`
  const resultRes = await fetch(resultUrl, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!resultRes.ok) {
    throw new Error(
      `LlamaExtract result fetch failed (${resultRes.status}): ${await resultRes.text()}`
    )
  }

  const resultJson = (await resultRes.json()) as Record<string, unknown>
  return (resultJson.data ?? resultJson.result ?? resultJson) as Record<string, unknown>
}
