/**
 * Stage 1 – PDF → LlamaExtract → Structured JSON.
 * Server-side only. Uses LLAMA_CLOUD_API_KEY.
 *
 * TWO-PHASE EXTRACTION:
 * Phase 1: Detect plan names and counts (lightweight)
 * Phase 2: Extract values using templates for known chapters + dynamic for others
 */

import type { ExtractedBenefitsData, DetectedPlans, Phase1Result, ExtractedChapterSection, CustomTemplateDefinition } from './types'
import { TABLE_TEMPLATES, isTemplatedCategory, buildTableDescription } from './tableTemplates'
import type { TemplateRow } from './tableTemplates'
import { buildSchemaFromTemplates, createSchemaContext } from './templates'
import { customTemplatePropertyKey } from './templates/custom'

const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai'

export type ExtractOptions = {
  apiKey: string
  pollIntervalMs?: number
  maxWaitMs?: number
}

// ── Phase 1: Plan Detection Schema ──

const PLAN_DETECTION_SCHEMA = {
  type: 'object',
  description: 'Detect all plan names mentioned in this benefits guide. Extract ONLY plan names and types — no details.',
  properties: {
    companyName: {
      type: 'string',
      description: 'Company/organization name.',
    },
    themeColor: {
      type: 'string',
      description: 'Primary brand color in hex format (e.g. #D31145) from logos/headers. Return null if not found.',
    },
    medicalPlans: {
      type: 'array',
      description: 'Short names of ALL medical plans (e.g., "PPO", "HDHP"). Extract EXACT labels from comparison tables. No long descriptions.',
      items: { type: 'string' },
    },
    dentalPlans: {
      type: 'array',
      description: 'Short names of ALL dental plans (e.g., "Dental PPO"). Extract EXACT labels from comparison tables.',
      items: { type: 'string' },
    },
    visionPlans: {
      type: 'array',
      description: 'Short names of ALL vision plans (e.g., "Vision Plan"). Extract EXACT labels from comparison tables.',
      items: { type: 'string' },
    },
    premiumTiers: {
      type: 'array',
      description: 'Coverage tier names (e.g., "Associate", "Family"). Extract EXACTLY as written.',
      items: { type: 'string' },
    },
    chaptersList: {
      type: 'array',
      description: 'List of ALL section/chapter topics found (e.g., "Medical", "FSA", "EAP", "Eligibility").',
      items: { type: 'string' },
    },
  },
  required: ['companyName', 'medicalPlans', 'dentalPlans', 'visionPlans'],
}

// ── Phase 2: Build dynamic extraction schema based on detected plans ──

function buildExtractionSchema(
  plans: DetectedPlans,
  chaptersList: string[] = [],
  templateIds?: string[],
  customTemplates?: CustomTemplateDefinition[]
): Record<string, unknown> {
  const ctx = createSchemaContext(plans, chaptersList)
  return buildSchemaFromTemplates(ctx, templateIds, customTemplates)
}

// ── Legacy buildExtractionSchema body moved to lib/benefits-import/templates/ ──
// Each chapter type now has its own template file that generates its schema fragment.
// See templates/index.ts for the composition logic.

// NOTE: The following code is kept as dead-code reference during migration.
// It will be removed once the template system is fully verified.
function _legacyBuildExtractionSchema_UNUSED(plans: DetectedPlans, chaptersList: string[] = []): Record<string, unknown> {
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
          description: `Plan Benefits Summary values for ${planName}. Extract In-network and Out-of-network values for every row.`,
          properties: {
            annual_deductible_in_network: { type: 'string', description: `In-network Annual deductible for ${planName}. e.g., "$2,000 per person"` },
            annual_deductible_out_of_network: { type: 'string', description: `Out-of-network Annual deductible for ${planName}.` },
            out_of_pocket_maximum_in_network: { type: 'string', description: `In-network Out-of-pocket maximum for ${planName}.` },
            out_of_pocket_maximum_out_of_network: { type: 'string', description: `Out-of-network Out-of-pocket maximum for ${planName}.` },
            coinsurance_in_network: { type: 'string', description: `In-network Coinsurance for ${planName}.` },
            coinsurance_out_of_network: { type: 'string', description: `Out-of-network Coinsurance for ${planName}.` },
            preventive_care_in_network: { type: 'string', description: `In-network Preventive care for ${planName}.` },
            preventive_care_out_of_network: { type: 'string', description: `Out-of-network Preventive care for ${planName}.` },
            primary_physician_office_visit_in_network: { type: 'string', description: `In-network PCP visit for ${planName}.` },
            primary_physician_office_visit_out_of_network: { type: 'string', description: `Out-of-network PCP visit for ${planName}.` },
            specialist_office_visit_in_network: { type: 'string', description: `In-network Specialist visit for ${planName}.` },
            specialist_office_visit_out_of_network: { type: 'string', description: `Out-of-network Specialist visit for ${planName}.` },
            independent_labs_in_network: { type: 'string', description: `In-network Labs for ${planName}.` },
            independent_labs_out_of_network: { type: 'string', description: `Out-of-network Labs for ${planName}.` },
            outpatient_xrays_in_network: { type: 'string', description: `In-network X-rays for ${planName}.` },
            outpatient_xrays_out_of_network: { type: 'string', description: `Out-of-network X-rays for ${planName}.` },
            imaging_in_network: { type: 'string', description: `In-network Imaging (MRI, CT, etc.) for ${planName}.` },
            imaging_out_of_network: { type: 'string', description: `Out-of-network Imaging for ${planName}.` },
            convenience_clinic_visit_in_network: { type: 'string', description: `In-network Convenience Clinic for ${planName}.` },
            convenience_clinic_visit_out_of_network: { type: 'string', description: `Out-of-network Convenience Clinic for ${planName}.` },
            teladoc_virtual_visit_in_network: { type: 'string', description: `In-network Virtual Visit for ${planName}.` },
            teladoc_virtual_visit_out_of_network: { type: 'string', description: `Out-of-network Virtual Visit for ${planName}.` },
            urgent_care_center_in_network: { type: 'string', description: `In-network Urgent Care for ${planName}.` },
            urgent_care_center_out_of_network: { type: 'string', description: `Out-of-network Urgent Care for ${planName}.` },
            emergency_room_in_network: { type: 'string', description: `In-network ER for ${planName}.` },
            emergency_room_out_of_network: { type: 'string', description: `Out-of-network ER for ${planName}.` },
            inpatient_hospitalization_in_network: { type: 'string', description: `In-network Hospitalization for ${planName}.` },
            inpatient_hospitalization_out_of_network: { type: 'string', description: `Out-of-network Hospitalization for ${planName}.` },
            outpatient_surgery_in_network: { type: 'string', description: `In-network Surgery for ${planName}.` },
            outpatient_surgery_out_of_network: { type: 'string', description: `Out-of-network Surgery for ${planName}.` },
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
    'eye_exam', 'new_frames', 'single', 'bifocal', 'trifocal', 'lenticular', 'elective', 'medically_necessary',
  ]
  const visionValuesSchema: Record<string, unknown> = {}
  for (const planName of visionPlanNames) {
    const safeName = planName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const props: Record<string, unknown> = {}
    for (const rowKey of visionRowKeys) {
      props[`${rowKey}_in_network`] = { type: 'string', description: `In-network value for "${rowKey.replace(/_/g, ' ')}" under ${planName}.` }
      props[`${rowKey}_out_of_network`] = { type: 'string', description: `Out-of-network value for "${rowKey.replace(/_/g, ' ')}" under ${planName}.` }
      props[`${rowKey}_frequency`] = { type: 'string', description: `Frequency/Limit for "${rowKey.replace(/_/g, ' ')}" under ${planName}. e.g. "Once every 12 months"` }
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
${chaptersList.length > 0 ? `\nSPECIFIC CHAPTERS TO EXTRACT: ${chaptersList.join(', ')}\n` : ''}
CRITICAL: Do NOT include Medical Plan or Overview chapters here — those are handled by the templated sections above.
NOTE: Vision and Dental plans are partially templated. Extract them here ONLY if their specific plan names were NOT detected in Phase 1 (i.e., if they were not captured by the specialized templates).`,
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

export async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeout?: number },
  maxRetries = 3,
  retryDelayMs = 2000
): Promise<Response> {
  const { timeout = 120000, ...rest } = options
  let lastError: Error | null = null

  for (let i = 0; i <= maxRetries; i++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      if (i > 0) {
        const delay = retryDelayMs * Math.pow(2, i - 1)
        console.log(`[benefits-import] Retrying fetch (${i}/${maxRetries}) in ${delay}ms... URL: ${url}`)
        await new Promise(r => setTimeout(r, delay))
      }

      const res = await fetch(url, {
        ...rest,
        signal: controller.signal,
      })
      return res
    } catch (err: any) {
      lastError = err as Error
      const name = err.name || 'Error'
      const isAbort = name === 'AbortError' || err.message?.includes('aborted')
      const isNetwork = err.message?.includes('fetch failed') ||
        err.message?.includes('ECONNRESET') ||
        err.message?.includes('ETIMEDOUT')

      if ((!isNetwork && !isAbort) || i === maxRetries) {
        throw err
      }

      const reason = isAbort ? `Timed out after ${timeout}ms` : err.message
      console.warn(`[benefits-import] Fetch attempt ${i + 1} failed (${reason}). Retrying...`)
    } finally {
      clearTimeout(timeoutId)
    }
  }
  throw lastError || new Error('Fetch failed after retries')
}


async function callLlamaExtract(
  pdfBuffer: Buffer,
  schema: Record<string, unknown>,
  apiKey: string,
  pollIntervalMs: number,
  maxWaitMs: number
): Promise<Record<string, unknown>> {
  const base64File = pdfBuffer.toString('base64')
  const extractUrl = `${LLAMA_API_BASE}/api/v1/extraction/run`

  console.log(`[benefits-import] Submitting extraction job to LlamaExtract... (Payload size: ${Math.round(base64File.length / 1024)}KB)`)

  const extractRes = await fetchWithRetry(extractUrl, {
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
    timeout: 180000, // 3 minute timeout for the initial upload/start
  })

  if (!extractRes.ok) {
    const errText = await extractRes.text()
    throw new Error(`LlamaExtract request failed (${extractRes.status}): ${errText}`)
  }

  const result = await extractRes.json() as Record<string, unknown>

  // Handle async job response
  if (result.id || result.job_id) {
    const jobId = (result.id ?? result.job_id) as string
    console.log(`[benefits-import] LlamaExtract job started: ${jobId}. Polling for results...`)
    return await pollForResults(jobId, apiKey, pollIntervalMs, maxWaitMs)
  }

  // Handle synchronous response
  if (result.data) return result.data as Record<string, unknown>
  if (result.companyName || result.chapters || result.medicalPlans) return result
  throw new Error('LlamaExtract returned an unexpected response format')
}

/**
 * Phase 1 only: detect plan names, chapters, and company info from a PDF.
 * Returns a Phase1Result for user review before Phase 2.
 */
export async function detectPlans(
  pdfBuffer: Buffer,
  options: ExtractOptions
): Promise<Phase1Result> {
  const { apiKey, pollIntervalMs = 5000, maxWaitMs = 600_000 } = options

  if (!apiKey?.trim()) {
    throw new Error('LLAMA_CLOUD_API_KEY is required for extraction')
  }

  console.log('[benefits-import] Phase 1: Detecting plan names and counts...')
  const phase1Result = await callLlamaExtract(pdfBuffer, PLAN_DETECTION_SCHEMA, apiKey, pollIntervalMs, maxWaitMs)

  const unwrapped = (phase1Result as any).extraction ?? phase1Result
  const detectedPlans: DetectedPlans = {
    medicalPlans: deduplicatePlanNames(Array.isArray(unwrapped.medicalPlans) ? unwrapped.medicalPlans : []),
    dentalPlans: deduplicatePlanNames(Array.isArray(unwrapped.dentalPlans) ? unwrapped.dentalPlans : []),
    visionPlans: deduplicatePlanNames(Array.isArray(unwrapped.visionPlans) ? unwrapped.visionPlans : []),
    premiumTiers: Array.isArray(unwrapped.premiumTiers) ? unwrapped.premiumTiers : [],
  }

  console.log(
    `[benefits-import] Phase 1 complete: ${detectedPlans.medicalPlans.length} medical plans (${detectedPlans.medicalPlans.join(', ')}), ` +
    `${detectedPlans.dentalPlans.length} dental plans (${detectedPlans.dentalPlans.join(', ')}), ` +
    `${detectedPlans.visionPlans.length} vision plans (${detectedPlans.visionPlans.join(', ')}), ` +
    `${detectedPlans.premiumTiers.length} premium tiers`
  )

  return {
    detectedPlans,
    chaptersList: Array.isArray(unwrapped.chaptersList) ? unwrapped.chaptersList : [],
    companyName: unwrapped.companyName || 'Unknown Company',
    themeColor: unwrapped.themeColor,
  }
}

/**
 * Phase 2 only: extract values using user-confirmed plans, then assemble.
 * Call this after the user has reviewed and edited the Phase 1 results.
 */
export async function extractWithConfirmedPlans(
  pdfBuffer: Buffer,
  confirmedPlans: DetectedPlans,
  options: ExtractOptions,
  phase1Overrides?: { companyName?: string; themeColor?: string; chaptersList?: string[] },
  templateIds?: string[],
  customTemplates?: CustomTemplateDefinition[]
): Promise<ExtractedBenefitsData> {
  const { apiKey, pollIntervalMs = 5000, maxWaitMs = 600_000 } = options

  if (!apiKey?.trim()) {
    throw new Error('LLAMA_CLOUD_API_KEY is required for extraction')
  }

  console.log('[benefits-import] Phase 2: Extracting values with template-guided schema...')
  const phase2Schema = buildExtractionSchema(confirmedPlans, phase1Overrides?.chaptersList, templateIds, customTemplates)
  const phase2Result = await callLlamaExtract(pdfBuffer, phase2Schema, apiKey, pollIntervalMs, maxWaitMs)

  const unwrapped2 = (phase2Result as any).extraction ?? phase2Result

  // Build a synthetic Phase 1 result for assembly (with user overrides)
  const phase1ForAssembly: Record<string, any> = {
    companyName: phase1Overrides?.companyName || unwrapped2.companyName || 'Unknown Company',
    themeColor: phase1Overrides?.themeColor || unwrapped2.themeColor,
  }

  return assembleExtractedData(unwrapped2, confirmedPlans, phase1ForAssembly, customTemplates)
}

/**
 * Full extraction (backward compatible): Phase 1 + Phase 2 in one call.
 * For new imports, prefer detectPlans() + extractWithConfirmedPlans() instead.
 */
export async function extractBenefitsGuide(
  pdfBuffer: Buffer,
  options: ExtractOptions
): Promise<ExtractedBenefitsData> {
  const phase1 = await detectPlans(pdfBuffer, options)
  return extractWithConfirmedPlans(pdfBuffer, phase1.detectedPlans, options, {
    companyName: phase1.companyName,
    themeColor: phase1.themeColor,
  })
}

/**
 * Assemble raw Phase 2 extraction results into the unified ExtractedBenefitsData format.
 */
function assembleExtractedData(
  raw: Record<string, any>,
  plans: DetectedPlans,
  phase1: Record<string, any>,
  customTemplates?: CustomTemplateDefinition[]
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

  // ── Overview Chapter (only if overview data was actually extracted) ──
  const hasOverviewData = ['medical', 'dental', 'vision'].some(bt => {
    const premiums = raw[`overview_${bt}_premiums`]
    const info = raw[`overview_${bt}_info`]
    const hasPremiums = premiums && typeof premiums === 'object' &&
      Object.values(premiums).some((v: any) => v && v !== '—' && v !== '')
    const hasInfo = info && typeof info === 'object' &&
      Object.values(info).some((v: any) => v && v !== '')
    return hasPremiums || hasInfo
  })

  if (hasOverviewData) {
    const overviewTables: ExtractedBenefitsData['chapters'][0]['tables'] = []
    const overviewSections: ExtractedBenefitsData['chapters'][0]['sections'] = []

    for (const benefitType of ['medical', 'dental', 'vision'] as const) {
      const planNames = benefitType === 'medical' ? medicalPlanNames
        : benefitType === 'dental' ? dentalPlanNames
          : visionPlanNames
      if (planNames.length === 0) continue

      const label = benefitType.charAt(0).toUpperCase() + benefitType.slice(1)

      // Provider info section
      const infoKey = `overview_${benefitType}_info`
      const info = raw[infoKey] || {}
      const sectionParagraphs: string[] = []
      if (info.providerDescription) sectionParagraphs.push(info.providerDescription)
      if (info.planCountSummary) sectionParagraphs.push(info.planCountSummary)

      if (sectionParagraphs.length > 0) {
        overviewSections.push({
          title: `${label} Plans`,
          paragraphs: sectionParagraphs,
        })
      }

      // Premium table
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
        tableTitle: template?.tableTitle || `${label} Plans`,
        tableDescription: template?.tableDescriptionTemplate,
        columns,
        rows,
      })
    }

    // Build overview content paragraphs
    const overviewContentParagraphs = [`Review and compare all benefit plans available to ${companyName} employees.`]

    chapters.push({
      title: 'Overview of Available Plans',
      description: `Overview of all available benefit plans for ${companyName} employees.`,
      category: 'overview',
      contentParagraphs: overviewContentParagraphs,
      sections: overviewSections.length > 0 ? overviewSections : undefined,
      tables: overviewTables,
    })
  }

  // ── Eligibility & Qualifying Life Events Chapter ──
  const eligData = raw.eligibility_chapter || {}
  if (eligData.eligibilityIntro || eligData.eligibilityRequirements?.length > 0 || eligData.enrollmentPoints?.length > 0 || eligData.commonQualifyingEvents?.length > 0) {
    const eligSections: ExtractedBenefitsData['chapters'][0]['sections'] = []
    const eligParagraphs: string[] = []

    // Eligibility requirements
    if (eligData.eligibilityIntro) eligParagraphs.push(eligData.eligibilityIntro)
    if (eligData.eligibilityRequirements?.length > 0) {
      eligSections.push({
        title: 'Eligibility',
        paragraphs: [eligData.eligibilityIntro || '', ...eligData.eligibilityRequirements].filter(Boolean),
      })
    }

    // Eligible dependents
    if (eligData.eligibleDependents?.length > 0) {
      eligSections.push({
        title: 'Eligible Dependents',
        paragraphs: eligData.eligibleDependents,
      })
    }

    // Enrollment
    if (eligData.enrollmentPoints?.length > 0) {
      eligSections.push({
        title: 'Enrollment',
        paragraphs: eligData.enrollmentPoints,
      })
    }

    // Qualifying Life Events
    const qleParagraphs: string[] = []
    if (eligData.qleDescription) qleParagraphs.push(eligData.qleDescription)
    if (eligData.qleImportantNotice) qleParagraphs.push(eligData.qleImportantNotice)

    if (eligData.commonQualifyingEvents?.length > 0) {
      eligSections.push({
        title: 'Common Qualifying Events',
        paragraphs: [...qleParagraphs, ...eligData.commonQualifyingEvents],
      })
    }

    if (eligData.lesserKnownQualifyingEvents?.length > 0) {
      eligSections.push({
        title: 'Lesser-Known Qualifying Events',
        paragraphs: eligData.lesserKnownQualifyingEvents,
      })
    }

    chapters.push({
      title: 'Eligibility & Qualifying Life Events',
      description: 'Information about who is eligible for benefits, eligible dependents, enrollment, and qualifying life events.',
      category: 'eligibility',
      contentParagraphs: eligParagraphs.length > 0 ? eligParagraphs : ['Eligibility and qualifying life events information.'],
      sections: eligSections.length > 0 ? eligSections : undefined,
    })
  }

  const capturedVisionPlanNames = new Set(visionPlanNames.map(n => n.toLowerCase().trim()))
  const capturedDentalPlanNames = new Set(dentalPlanNames.map(n => n.toLowerCase().trim()))

  // ── Medical Common Info (Extracted once, appended to chapters) ──
  const commonInfo = raw.medical_common_info || {}
  const commonSections: ExtractedChapterSection[] = []
  if (commonInfo.inNetworkVsOutNetworkTitle) {
    commonSections.push({
      title: commonInfo.inNetworkVsOutNetworkTitle,
      paragraphs: [
        '**In-network**',
        ...(commonInfo.inNetworkExplanation || []),
        '**Out-of-network**',
        ...(commonInfo.outOfNetworkExplanation || []),
        commonInfo.networkCheckInstructions
      ].filter(Boolean),
      isList: true
    })
  }
  if (commonInfo.helpSectionTitle) {
    commonSections.push({
      title: commonInfo.helpSectionTitle,
      paragraphs: [
        commonInfo.alexDescription,
        commonInfo.pharmacyInfo,
        commonInfo.virtualVisitInfo,
        commonInfo.toolkitAppLink ? `**Toolkit App**: ${commonInfo.toolkitAppLink}` : null
      ].filter(Boolean)
    })
  }

  // ── Medical Plan Chapters (one per plan, only if data was extracted) ──
  const medicalTemplate = TABLE_TEMPLATES['medical']
  for (const planName of medicalPlanNames) {
    const safeName = planName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    const planData = raw[`medical_${safeName}`]

    // Skip this plan if no actual data was extracted (prevents empty overwrites in batched extraction)
    if (!planData || typeof planData !== 'object') continue
    const hasAnyValue = planData.planOverview || planData.hsaEligible ||
      (planData.premiums && Object.values(planData.premiums).some((v: any) => v && v !== '—')) ||
      (planData.benefits && Object.values(planData.benefits).some((v: any) => v && v !== '—')) ||
      (planData.prescriptionDrug && Object.values(planData.prescriptionDrug).some((v: any) => v && v !== '—'))
    if (!hasAnyValue) continue

    const premiums = planData.premiums || {}
    const terms = planData.terms || {}
    const benefits = planData.benefits || {}
    const rx = planData.prescriptionDrug || {}
    const hsaEligible = planData.hsaEligible || ''

    // Table 1: Premium Rates
    const premiumCols = [{ key: safeName, label: planName }]
    const premiumRows = tierNames.map(tier => ({
      label: tier,
      cells: [premiums[tier.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()] || '—'],
    }))

    // Plan-specific Sections (Terms)
    const planSections: ExtractedChapterSection[] = []
    if (terms.copaysDefinition?.length > 0) {
      planSections.push({ title: 'Copays', paragraphs: terms.copaysDefinition, isList: true })
    }
    if (terms.deductibleDefinition?.length > 0) {
      planSections.push({ title: 'Deductible', paragraphs: terms.deductibleDefinition, isList: true })
    }
    if (terms.outOfPocketMaxDefinition?.length > 0) {
      planSections.push({ title: 'Out-of-Pocket Maximum', paragraphs: terms.outOfPocketMaxDefinition, isList: true })
    }

    // Table 2: Plan Benefits Summary (In-Network + Out-of-Network)
    const benefitCols = [
      { key: `${safeName}_in`, label: `${planName} Plan`, subLabel: 'In-network' },
      { key: `${safeName}_out`, label: `${planName} Plan`, subLabel: 'Out-of-network' },
    ]
    const benefitTemplate = medicalTemplate.tables[1]
    const benefitRows = benefitTemplate.rows.map(row => {
      if (row.isSection) {
        return { label: row.label, cells: [], isSection: true }
      }
      const baseKey = row.label.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      return {
        label: row.label,
        cells: [
          benefits[`${baseKey}_in_network`] || '—',
          benefits[`${baseKey}_out_of_network`] || '—',
        ]
      }
    })

    // Table 3: Prescription Drug Coverage
    const rxKeyMap: Record<string, string> = {
      'Preventive Medication': 'preventive_medication',
      'Pharmacy Deductible': 'pharmacy_deductible',
      'Tier one': 'retail_tier_one',
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
      sections: [...planSections, ...commonSections],
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
  const dentalData = (raw.dental_multi_plan || raw.dental_single_plan) as any
  if (dentalData && dentalPlanNames.length > 0) {
    const isMultiD = !!raw.dental_multi_plan

    // 1. Columns
    const dentalCols = dentalPlanNames.flatMap((pn, idx) => {
      const num = idx + 1
      return [
        { key: `plan${num}_in`, label: pn, subLabel: 'In-network' },
        { key: `plan${num}_out`, label: pn, subLabel: 'Out-of-network' },
      ]
    })

    // 2. Rows
    const dentalRows = (dentalData.benefitRows || []).map((row: any) => {
      const cells = dentalPlanNames.flatMap((_, idx) => {
        const num = idx + 1
        if (isMultiD) {
          return [
            row[`plan${num}_in_network`] || '—',
            row[`plan${num}_out_of_network`] || '—',
          ]
        } else {
          return [
            row.in_network || '—',
            row.out_of_network || '—',
          ]
        }
      })
      return { label: row.label || '—', cells }
    })

    chapters.push({
      title: 'Dental Plan',
      description: 'Dental coverage options and benefits comparison.',
      category: 'dental',
      contentParagraphs: dentalData.introText ? [dentalData.introText] : ['Compare dental plan options and their coverage details.'],
      tables: [{
        templateId: 'dental-benefits',
        tableTitle: 'Dental',
        columns: dentalCols,
        rows: dentalRows,
      }],
    })
  }

  // ── Vision Chapter ──
  const visionData = (raw.vision_multi_plan || raw.vision_single_plan) as any
  if (visionData && visionPlanNames.length > 0) {
    const isMultiV = !!raw.vision_multi_plan

    // 1. Columns (Strictley 2 per plan: In-network & Out-of-network)
    const visionCols = visionPlanNames.flatMap((pn, idx) => {
      const num = idx + 1
      return [
        { key: `plan${num}_in`, label: pn, subLabel: 'In-network' },
        { key: `plan${num}_out`, label: pn, subLabel: 'Out-of-network (reimbursement)' },
      ]
    })

    // 2. Rows
    const visionRows: any[] = []
      ; (visionData.benefitRows || []).forEach((row: any) => {
        // Main benefit row (In/Out)
        const cells = visionPlanNames.flatMap((_, idx) => {
          const num = idx + 1
          return isMultiV
            ? [row[`plan${num}_in_network`] || '—', row[`plan${num}_out_of_network`] || '—']
            : [row.in_network || '—', row.out_of_network || '—']
        })
        visionRows.push({ label: row.label || '—', cells })

        // If there's frequency data and it wasn't just a "Frequency" row already, 
        // add a sub-row for Frequency to match Image 5 style
        const hasFreq = isMultiV ? (row.plan1_frequency || row.plan2_frequency) : row.frequency
        if (hasFreq && row.label?.toLowerCase() !== 'frequency') {
          const freqCells = visionPlanNames.flatMap((_, idx) => {
            const num = idx + 1
            const f = isMultiV ? row[`plan${num}_frequency`] : row.frequency
            return [f || '—', f || '—'] // Repeat for In/Out columns
          })
          visionRows.push({ label: 'Frequency', cells: freqCells })
        }
      })

    // 3. Footnotes/Disclaimers
    const visionSections: ExtractedChapterSection[] = []
    if (visionData.footnotes) {
      visionSections.push({
        title: 'Notes & Disclaimers',
        paragraphs: [visionData.footnotes]
      })
    }

    chapters.push({
      title: 'Vision Benefits',
      description: 'Vision coverage options and benefits comparison.',
      category: 'vision',
      contentParagraphs: visionData.introText ? [visionData.introText] : ['Compare vision plan options and their coverage details.'],
      sections: visionSections.length > 0 ? visionSections : undefined,
      tables: [{
        templateId: 'vision-benefits',
        tableTitle: 'Vision Coverage Comparison',
        columns: visionCols,
        rows: visionRows,
      }],
    })
  }

  // ── EAP Chapter ──
  const eapData = raw.eap_chapter || {}
  if (Object.keys(eapData).length > 0) {
    const sections: ExtractedChapterSection[] = []
    if (eapData.description) sections.push({ title: 'Overview', paragraphs: [eapData.description] })
    if (eapData.freeVisits) sections.push({ title: 'Free Visits', paragraphs: [eapData.freeVisits] })
    if (eapData.services?.length > 0) sections.push({ title: 'Services include:', paragraphs: eapData.services, isList: true })

    chapters.push({
      title: 'Employee Assistance Program (EAP)',
      description: eapData.description || 'Confidential counseling and support services.',
      category: 'eap',
      contentParagraphs: [eapData.description, eapData.availabilityNote].filter(Boolean),
      sections,
    })
  }

  // ── FSA & HSA Chapter ──
  const fsaHsaData = raw.fsa_hsa_chapter || {}
  if (Object.keys(fsaHsaData).length > 0) {
    const sections: ExtractedChapterSection[] = []
    const tables: any[] = []

    // ── HSA Sections ──
    if (fsaHsaData.hsaDefinition?.length > 0) {
      sections.push({ title: 'What is a Health Savings Account?', paragraphs: fsaHsaData.hsaDefinition, isList: true })
    }
    if (fsaHsaData.hsaBenefits?.length > 0) {
      sections.push({ title: 'Benefits of HSA', paragraphs: fsaHsaData.hsaBenefits, isList: true })
    }
    if (fsaHsaData.hsaEligibility?.length > 0) {
      sections.push({ title: 'Who is eligible for an HSA?', paragraphs: fsaHsaData.hsaEligibility, isList: true })
    }
    if (fsaHsaData.hsaManageAccount?.length > 0) {
      sections.push({ title: 'How to manage your HSA account', paragraphs: fsaHsaData.hsaManageAccount, isList: true })
    }

    // ── HSA Employer Contribution Table ──
    if (fsaHsaData.hsaEmployerContributionRows?.length > 0) {
      const cols = (fsaHsaData.hsaEmployerContributionColumns || []).map((c: string, i: number) => ({
        key: `hsa-ec-col-${i}`, label: c
      }))
      const rows = fsaHsaData.hsaEmployerContributionRows.map((r: any) => ({
        label: r.label || '—',
        cells: (r.cells || []).map((c: string) => c || '—')
      }))
      tables.push({
        templateId: 'hsa-employer-contribution',
        tableTitle: fsaHsaData.hsaEmployerContributionTableTitle || 'Employer Contribution',
        columns: cols,
        rows: rows,
      })
    }

    // ── HSA Contribution Limits Table ──
    if (fsaHsaData.hsaContributionLimitsRows?.length > 0) {
      const cols = (fsaHsaData.hsaContributionLimitsColumns || []).map((c: string, i: number) => ({
        key: `hsa-cl-col-${i}`, label: c
      }))
      const rows = fsaHsaData.hsaContributionLimitsRows.map((r: any) => ({
        label: r.label || '—',
        cells: (r.cells || []).map((c: string) => c || '—')
      }))
      tables.push({
        templateId: 'hsa-contribution-limits',
        tableTitle: fsaHsaData.hsaContributionLimitsTableTitle || 'How much can I contribute?',
        columns: cols,
        rows: rows,
      })
    }

    // ── Eligible Expenses ──
    if (fsaHsaData.hsaEligibleExpenses?.length > 0) {
      sections.push({ title: 'Eligible expenses', paragraphs: fsaHsaData.hsaEligibleExpenses, isList: true })
    }

    // ── FSA Definition ──
    if (fsaHsaData.fsaDefinition) {
      sections.push({ title: 'What is a Flexible Spending Account?', paragraphs: [fsaHsaData.fsaDefinition] })
    }

    // ── FSA Types Comparison Table ──
    if (fsaHsaData.fsaTypesRows?.length > 0) {
      const cols = (fsaHsaData.fsaTypesColumns || []).map((c: string, i: number) => ({
        key: `fsa-type-col-${i}`, label: c
      }))
      const rows = fsaHsaData.fsaTypesRows.map((r: any) => ({
        label: r.label || '—',
        cells: (r.cells || []).map((c: string) => c || '—')
      }))
      tables.push({
        templateId: 'fsa-types-comparison',
        tableTitle: fsaHsaData.fsaTypesTableTitle || 'Types of FSA',
        columns: cols,
        rows: rows,
      })
    }

    // ── Understanding different types of FSAs ──
    if (fsaHsaData.fsaTypesExplanation?.length > 0) {
      sections.push({ title: 'Understanding different types of FSAs', paragraphs: fsaHsaData.fsaTypesExplanation })
    }

    // ── Transit FSA ──
    if (fsaHsaData.transitFsaDefinition?.length > 0) {
      sections.push({ title: 'Transit FSA', paragraphs: fsaHsaData.transitFsaDefinition, isList: true })
    }
    if (fsaHsaData.transitFsaRows?.length > 0) {
      const cols = (fsaHsaData.transitFsaColumns || []).map((c: string, i: number) => ({
        key: `transit-col-${i}`, label: c
      }))
      const rows = fsaHsaData.transitFsaRows.map((r: any) => ({
        label: '',
        cells: (r.cells || []).map((c: string) => c || '—')
      }))
      tables.push({
        templateId: 'transit-fsa',
        tableTitle: fsaHsaData.transitFsaTableTitle || 'Transit FSA',
        columns: cols,
        rows: rows,
      })
    }

    // ── Parking FSA ──
    if (fsaHsaData.parkingFsaDefinition?.length > 0) {
      sections.push({ title: 'Parking FSA', paragraphs: fsaHsaData.parkingFsaDefinition, isList: true })
    }
    if (fsaHsaData.parkingFsaRows?.length > 0) {
      const cols = (fsaHsaData.parkingFsaColumns || []).map((c: string, i: number) => ({
        key: `parking-col-${i}`, label: c
      }))
      const rows = fsaHsaData.parkingFsaRows.map((r: any) => ({
        label: '',
        cells: (r.cells || []).map((c: string) => c || '—')
      }))
      tables.push({
        templateId: 'parking-fsa',
        tableTitle: fsaHsaData.parkingFsaTableTitle || 'Parking FSA',
        columns: cols,
        rows: rows,
      })
    }

    // ── Dynamic Title ──
    const hasHsa = fsaHsaData.hsaDefinition?.length > 0 || fsaHsaData.hsaEmployerContributionRows?.length > 0
    const hasFsa = fsaHsaData.fsaDefinition || fsaHsaData.fsaTypesRows?.length > 0
    const hasTransit = fsaHsaData.transitFsaRows?.length > 0 || fsaHsaData.parkingFsaRows?.length > 0

    let displayTitle = 'FSA and HSA'
    if (hasHsa && !hasFsa && !hasTransit) displayTitle = 'Health Savings Account (HSA)'
    else if (!hasHsa && hasFsa && !hasTransit) displayTitle = 'Flexible Spending Account (FSA)'
    else if (!hasHsa && !hasFsa && hasTransit) displayTitle = 'Transit and Parking FSA'
    else if (hasHsa && hasFsa) displayTitle = 'Health Savings Account (HSA) & Flexible Spending Account (FSA)'

    chapters.push({
      title: displayTitle,
      description: 'HSA and FSA account options for tax-advantaged savings.',
      category: 'fsa-hsa',
      contentParagraphs: ['Understand your tax-advantaged savings account options.'],
      sections,
      tables: tables.length > 0 ? tables : undefined,
    })
  }

  // ── Survivor Benefits Chapter ──
  const survivorData = raw.survivor_benefits_chapter || {}
  if (Object.keys(survivorData).length > 0) {
    const sections: ExtractedChapterSection[] = []
    const tables: any[] = []

    // ── Intro ──
    if (survivorData.introText) {
      sections.push({ title: 'RS&H provides Basic Life and Accidental Death & Dismemberment Insurance (AD&D)', paragraphs: [survivorData.introText] })
    }

    // ── Coverage Amount ──
    if (survivorData.coverageAmountBullets?.length > 0) {
      sections.push({
        title: 'Coverage amount',
        paragraphs: survivorData.coverageAmountBullets,
        isList: true
      })
    }

    // ── Age Reduction Table ──
    if (survivorData.ageReductionTable?.headers?.length > 0) {
      const cols = survivorData.ageReductionTable.headers.map((h: string, i: number) => ({
        key: `age-col-${i}`, label: h
      }))
      const rows = [{
        label: 'The policy reduces by:',
        cells: survivorData.ageReductionTable.values || []
      }]
      tables.push({
        templateId: 'survivor-age-reduction',
        tableTitle: 'At age:',
        columns: cols,
        rows: rows,
      })
    }

    // ── AD&D Coverage ──
    if (survivorData.adAndDDescription || survivorData.adAndDBullets?.length > 0) {
      sections.push({
        title: 'AD&D Coverage',
        paragraphs: [survivorData.adAndDDescription, ...(survivorData.adAndDBullets || [])].filter(Boolean),
        isList: true
      })
    }

    // ── Other Voluntary Benefits ──
    if (survivorData.voluntaryBenefitsDescription || survivorData.voluntaryBenefitsBullets?.length > 0) {
      sections.push({
        title: 'Other Voluntary benefits',
        paragraphs: [survivorData.voluntaryBenefitsDescription, ...(survivorData.voluntaryBenefitsBullets || [])].filter(Boolean),
        isList: true
      })
    }

    // ── Beneficiary Note ──
    if (survivorData.beneficiaryNote) {
      sections.push({ title: 'Designating Beneficiaries', paragraphs: [survivorData.beneficiaryNote] })
    }

    chapters.push({
      title: 'Survivor Benefits',
      description: survivorData.introText?.slice(0, 200) || 'Basic Life and Accidental Death & Dismemberment (AD&D) insurance.',
      category: 'life-insurance',
      contentParagraphs: [survivorData.introText].filter(Boolean),
      sections,
      tables: tables.length > 0 ? tables : undefined,
    })
  }

  // ── Supplemental Health Chapter ──
  const suppHealthData = raw.supplemental_health_chapter || {}
  if (Object.keys(suppHealthData).length > 0) {
    const sections: ExtractedChapterSection[] = []
    const tables: any[] = []

    // ── Intro ──
    if (suppHealthData.introParagraphs?.length > 0) {
      sections.push({ title: 'What is Supplemental Health?', paragraphs: suppHealthData.introParagraphs })
    }

    // ── Critical Illness ──
    if (suppHealthData.criticalIllnessCoverageBullets?.length > 0) {
      sections.push({ title: 'Critical Illness Coverage', paragraphs: suppHealthData.criticalIllnessCoverageBullets, isList: true })
    }
    if (suppHealthData.coveredIllnessList?.length > 0) {
      sections.push({ title: 'Covered illness include:', paragraphs: suppHealthData.coveredIllnessList, isList: true })
    }
    if (suppHealthData.paymentFrequencyBullets?.length > 0) {
      sections.push({ title: 'Payment frequency', paragraphs: suppHealthData.paymentFrequencyBullets, isList: true })
    }

    // ── Critical Illness Cost Table ──
    if (suppHealthData.criticalIllnessCostTable?.length > 0) {
      const cols = [{ key: 'tier', label: 'Critical Illness and Cancer Insurance' }, { key: 'benefit', label: 'Benefit' }]
      const rows = suppHealthData.criticalIllnessCostTable.map((r: any) => ({
        label: r.tier || '—',
        cells: [r.benefit || '—']
      }))
      tables.push({
        templateId: 'critical-illness-costs',
        tableTitle: 'Associate cost summary',
        columns: cols,
        rows: rows,
      })
    }

    // ── Accident Coverage ──
    if (suppHealthData.accidentCoverageBullets?.length > 0) {
      sections.push({ title: 'Accident Coverage', paragraphs: suppHealthData.accidentCoverageBullets, isList: true })
    }

    // ── Accident Payout Table ──
    if (suppHealthData.accidentPayoutTable?.length > 0) {
      const cols = [{ key: 'service', label: 'Accident Insurance' }, { key: 'amount', label: 'Coverage Amount' }]
      const rows = suppHealthData.accidentPayoutTable.map((r: any) => ({
        label: r.service || '—',
        cells: [r.amount || '—']
      }))
      tables.push({
        templateId: 'accident-payouts',
        tableTitle: 'Coverage Details',
        columns: cols,
        rows: rows,
      })
    }

    // ── Accident Contribution Table ──
    if (suppHealthData.accidentContributionsTable?.length > 0) {
      const cols = [{ key: 'tier', label: 'Accident Insurance' }, { key: 'cost', label: 'Bi-weekly Associate Payroll Contributions' }]
      const rows = suppHealthData.accidentContributionsTable.map((r: any) => ({
        label: r.tier || '—',
        cells: [r.cost || '—']
      }))
      tables.push({
        templateId: 'accident-contributions',
        tableTitle: 'Payroll Contributions',
        columns: cols,
        rows: rows,
      })
    }

    // ── Additional Details ──
    if (suppHealthData.additionalDetails?.length > 0) {
      sections.push({ title: 'Notes & Disclaimers', paragraphs: suppHealthData.additionalDetails })
    }

    chapters.push({
      title: 'Supplemental Health',
      description: `Supplemental health benefits provided by ${suppHealthData.providerName || 'the carrier'}.`,
      category: 'supplemental',
      contentParagraphs: [suppHealthData.providerName ? `Provider: ${suppHealthData.providerName}` : ''].filter(Boolean),
      sections,
      tables: tables.length > 0 ? tables : undefined,
    })
  }

  // ── Income Protection Chapter ──
  const incomeData = raw.income_protection_chapter || {}
  if (Object.keys(incomeData).length > 0) {
    const sections: ExtractedChapterSection[] = []
    const tables: any[] = []

    // ── Intro ──
    if (incomeData.introParagraphs?.length > 0) {
      sections.push({ title: 'Overview', paragraphs: incomeData.introParagraphs })
    }

    // ── Short-Term Disability (STD) ──
    if (incomeData.stdIntroBullets?.length > 0) {
      sections.push({
        title: incomeData.stdTitle || 'Short-Term Disability Insurance Core Plan',
        paragraphs: incomeData.stdIntroBullets,
        isList: true
      })
    }

    // ── STD Table ──
    if (incomeData.stdTableRows?.length > 0) {
      const headers = incomeData.stdTableHeaders || ['Insurance Coverage', 'Short-Term Disability Core Plan', 'Short-Term Disability Buy-Up Plan*']
      const cols = headers.map((h: string, i: number) => ({
        key: `std-col-${i}`, label: h
      }))
      const rows = incomeData.stdTableRows.map((r: any) => ({
        label: r.label || '—',
        cells: [r.coreValue || '—', r.buyUpValue || '—']
      }))
      tables.push({
        templateId: 'std-comparison',
        tableTitle: 'Short-Term Disability Plans',
        columns: cols,
        rows: rows,
      })
    }
    if (incomeData.stdFootnote) {
      sections.push({ title: 'STD Notes', paragraphs: [incomeData.stdFootnote] })
    }

    // ── Long-Term Disability (LTD) ──
    if (incomeData.ltdIntroBullets?.length > 0) {
      sections.push({
        title: incomeData.ltdTitle || 'Long-Term Disability Insurance',
        paragraphs: incomeData.ltdIntroBullets,
        isList: true
      })
    }

    // ── LTD Table ──
    if (incomeData.ltdTableRows?.length > 0) {
      const headers = incomeData.ltdTableHeaders || ['Insurance Coverage', 'Long-Term Disability Plan']
      const cols = headers.map((h: string, i: number) => ({
        key: `ltd-col-${i}`, label: h
      }))
      const rows = incomeData.ltdTableRows.map((r: any) => ({
        label: r.label || '—',
        cells: [r.value || '—']
      }))
      tables.push({
        templateId: 'ltd-details',
        tableTitle: 'Long-Term Disability Plan',
        columns: cols,
        rows: rows,
      })
    }

    // ── Additional Details ──
    if (incomeData.additionalDetails?.length > 0) {
      sections.push({ title: 'Notes & Disclaimers', paragraphs: incomeData.additionalDetails })
    }

    chapters.push({
      title: 'Income Protection (Disability)',
      description: 'Short-term and long-term disability insurance and income protection benefits.',
      category: 'disability',
      contentParagraphs: [incomeData.introParagraphs?.[0], 'Understand your disability insurance options.'].filter(Boolean),
      sections,
      tables: tables.length > 0 ? tables : undefined,
    })
  }

  // ── Financial Wellbeing Chapter ──
  const financialData = raw.financial_wellbeing_chapter || {}
  if (Object.keys(financialData).length > 0) {
    const sections: ExtractedChapterSection[] = []
    const tables: any[] = []

    // ── Fidelity Transition ──
    if (financialData.fidelityTransitionBullets?.length > 0) {
      sections.push({
        title: financialData.fidelityTransitionTitle || 'Transitioning to Fidelity for 401(k)',
        paragraphs: financialData.fidelityTransitionBullets,
        isList: true
      })
    }

    // ── Eligibility ──
    if (financialData.eligibilityBullets?.length > 0) {
      sections.push({ title: 'Eligibility', paragraphs: financialData.eligibilityBullets, isList: true })
    }

    // ── Enrollment & Contributions ──
    if (financialData.autoEnrollmentBullets?.length > 0) {
      sections.push({
        title: 'Employee enrollment and contributions',
        paragraphs: [financialData.enrollmentIntro, ...financialData.autoEnrollmentBullets].filter(Boolean),
        isList: true
      })
    }

    // ── Contribution Limits Table ──
    if (financialData.contributionLimitsTable?.length > 0) {
      const cols = [
        { key: 'type', label: 'Contribution Type' },
        { key: 'age', label: 'Age' },
        { key: 'max', label: 'Annual Maximum Contribution' },
        { key: 'match', label: 'Eligible for Company Match' },
        { key: 'info', label: 'Information' }
      ]
      const rows = financialData.contributionLimitsTable.map((r: any) => ({
        label: r.type || '—',
        cells: [r.age || '—', r.maxContribution || '—', r.eligibleForMatch || '—', r.info || '—']
      }))
      tables.push({
        templateId: '401k-contribution-limits',
        tableTitle: 'Annual Contribution Limits',
        columns: cols,
        rows: rows,
      })
    }

    // ── Company Matching ──
    if (financialData.companyMatchingBullets?.length > 0) {
      sections.push({
        title: financialData.companyMatchingTitle || 'Company matching',
        paragraphs: [...financialData.companyMatchingBullets, financialData.matchingExample].filter(Boolean),
        isList: true
      })
    }

    // ── Vesting Schedule ──
    if (financialData.vestingIntroBullets?.length > 0) {
      sections.push({ title: 'Vesting schedule', paragraphs: financialData.vestingIntroBullets, isList: true })
    }
    if (financialData.vestingScheduleTable?.length > 0) {
      const cols = [{ key: 'years', label: 'Years of Service' }, { key: 'percent', label: 'Vesting Percentage' }]
      const rows = financialData.vestingScheduleTable.map((r: any) => ({
        label: r.years || '—',
        cells: [r.percentage || '—']
      }))
      tables.push({
        templateId: '401k-vesting-schedule',
        tableTitle: 'Vesting Schedule',
        columns: cols,
        rows: rows,
      })
    }

    // ── Account Types ──
    if (financialData.preTaxAccountBullets?.length > 0) {
      sections.push({ title: 'Pre-tax 401(k)', paragraphs: financialData.preTaxAccountBullets, isList: true })
    }
    if (financialData.rothAccountBullets?.length > 0) {
      sections.push({ title: 'Roth 401(k)', paragraphs: financialData.rothAccountBullets, isList: true })
    }

    // ── Beneficiaries ──
    if (financialData.beneficiariesBullets?.length > 0) {
      sections.push({ title: 'Beneficiaries', paragraphs: financialData.beneficiariesBullets, isList: true })
    }

    // ── Additional Topics ──
    if (financialData.loansInfo) sections.push({ title: 'Loans', paragraphs: [financialData.loansInfo] })
    if (financialData.employeeOwnershipInfo) sections.push({ title: 'Employee Ownership', paragraphs: [financialData.employeeOwnershipInfo] })
    if (financialData.investmentOpportunities) sections.push({ title: 'Opportunities for Investment', paragraphs: [financialData.investmentOpportunities] })
    if (financialData.additionalDetails?.length > 0) {
      sections.push({ title: 'Other Retirement Details', paragraphs: financialData.additionalDetails })
    }

    chapters.push({
      title: 'Financial Wellbeing (401k)',
      description: financialData.introParagraph?.slice(0, 160) || 'Retirement savings and financial wellbeing benefits.',
      category: 'retirement',
      contentParagraphs: [financialData.introParagraph].filter(Boolean),
      sections,
      tables: tables.length > 0 ? tables : undefined,
    })
  }

  // ── Paid Time Off (PTO) Chapter ──
  const ptoData = raw.paid_time_off_chapter || {}
  if (Object.keys(ptoData).length > 0) {
    const sections: ExtractedChapterSection[] = []
    const tables: any[] = []

    // ── Holidays ──
    if (ptoData.observedHolidays?.length > 0) {
      sections.push({
        title: 'Holidays',
        paragraphs: [ptoData.holidayIntro, ...ptoData.observedHolidays].filter(Boolean),
        isList: true
      })
    }
    if (ptoData.floatingHolidayDescription) {
      sections.push({ title: 'Floating Holiday', paragraphs: [ptoData.floatingHolidayDescription] })
    }
    if (ptoData.religiousHolidaysDescription) {
      sections.push({ title: 'Religious Holidays', paragraphs: [ptoData.religiousHolidaysDescription] })
    }

    // ── Time Away (Vacation) ──
    if (ptoData.vacationIntro) {
      sections.push({ title: 'Time Away', paragraphs: [ptoData.vacationIntro] })
    }

    // ── Vacation Accrual Table ──
    if (ptoData.vacationAccrualTable?.length > 0) {
      const cols = [{ key: 'years', label: 'Years of Service' }, { key: 'entitlement', label: 'Vacation Entitlement' }]
      const rows = ptoData.vacationAccrualTable.map((r: any) => ({
        label: r.yearsOfService || '—',
        cells: [r.entitlement || '—']
      }))
      tables.push({
        templateId: 'vacation-accrual',
        tableTitle: 'Vacation Schedule',
        columns: cols,
        rows: rows,
      })
    }

    if (ptoData.accrualExplanationBullets?.length > 0) {
      sections.push({ title: 'Accrual Logic', paragraphs: ptoData.accrualExplanationBullets, isList: true })
    }

    // ── Additional Leave ──
    if (ptoData.personalLeaveDescription) {
      sections.push({ title: 'Personal Leave (PL)', paragraphs: [ptoData.personalLeaveDescription] })
    }
    if (ptoData.leaveBankDescription) {
      sections.push({ title: 'Leave Bank (LB)', paragraphs: [ptoData.leaveBankDescription] })
    }
    if (ptoData.paidParentalLeaveDescription || ptoData.paidParentalLeaveSpecifics?.length > 0) {
      sections.push({
        title: 'Paid Parental Leave (PPL)',
        paragraphs: [ptoData.paidParentalLeaveDescription, ...(ptoData.paidParentalLeaveSpecifics || [])].filter(Boolean),
        isList: true
      })
    }
    if (ptoData.bereavementLeaveDescription) {
      sections.push({ title: 'Bereavement Leave', paragraphs: [ptoData.bereavementLeaveDescription] })
    }
    if (ptoData.juryDutyDescription) {
      sections.push({ title: 'Jury Duty', paragraphs: [ptoData.juryDutyDescription] })
    }

    if (ptoData.additionalDetails?.length > 0) {
      sections.push({ title: 'Other PTO Details', paragraphs: ptoData.additionalDetails })
    }

    chapters.push({
      title: 'Paid Time Off and Other Benefits',
      description: ptoData.holidayIntro?.slice(0, 160) || 'Observed holidays, vacation allowance, and additional leave policies.',
      category: 'pto',
      contentParagraphs: [ptoData.holidayIntro].filter(Boolean),
      sections,
      tables: tables.length > 0 ? tables : undefined,
    })
  }

  // ── Voluntary Benefits Chapter ──
  const voluntaryData = raw.voluntary_benefits_chapter || {}
  if (voluntaryData.benefits?.length > 0) {
    const tabs: any[] = voluntaryData.benefits.map((b: any) => ({
      title: b.tabTitle || b.title || 'Benefit',
      contentParagraphs: [
        b.about,
        b.howItWorks ? `**How it works**\n${b.howItWorks}` : null,
        b.providerName ? `Provider: ${b.providerName}` : null,
        ...(b.coverageDetails || [])
      ].filter(Boolean),
      link: b.quoteLink,
      linkLabel: b.quoteLink ? 'Get a Quote' : undefined
    }))

    chapters.push({
      title: voluntaryData.introTitle || 'Additional Voluntary Benefits',
      description: voluntaryData.introDescription || 'Optional benefits including pet, auto, home, and legal insurance.',
      category: 'voluntary-benefits',
      contentParagraphs: [voluntaryData.introDescription].filter(Boolean),
      tabs
    })
  }

  // ── Dynamic Chapters fallback ──
  const dynamicChapters = Array.isArray(raw.dynamicChapters) ? raw.dynamicChapters : []
  for (const dc of dynamicChapters) {
    if (!dc.title) continue

    // Deduplication: Skip if this is a templated chapter we already captured
    const titleLower = dc.title.toLowerCase()
    const templatedTitles = [
      'overview', 'eligibility', 'medical', 'dental', 'vision', 'eap', 'fsa', 'hsa',
      'life', 'disability', 'wellbeing', 'paid time off', 'voluntary'
    ]
    if (templatedTitles.some(t => titleLower.includes(t))) {
      console.log(`[benefits-import] Skipping dynamic chapter duplicate: "${dc.title}"`)
      continue
    }

    // Also skip if it's a specific vision/dental plan name that was already captured
    if (capturedVisionPlanNames.has(titleLower) || capturedDentalPlanNames.has(titleLower)) {
      console.log(`[benefits-import] Skipping dynamic chapter "${dc.title}" - plan name already captured by template.`)
      continue
    }

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

  // ── Custom Template Chapters ──
  if (customTemplates?.length) {
    for (const tmpl of customTemplates) {
      const propKey = customTemplatePropertyKey(tmpl.templateId)
      const chapterData = raw[propKey]
      if (!chapterData || typeof chapterData !== 'object' || Object.keys(chapterData).length === 0) continue

      const hasAnyValue = Object.values(chapterData).some((v: any) => {
        if (!v) return false
        if (typeof v === 'string') return v.trim().length > 0
        if (Array.isArray(v)) return v.length > 0
        if (typeof v === 'object') return Object.keys(v).length > 0
        return false
      })
      if (!hasAnyValue) continue

      const contentParagraphs: string[] = []
      const sections: ExtractedChapterSection[] = []
      const tables: ExtractedBenefitsData['chapters'][0]['tables'] = []

      for (const field of tmpl.fields) {
        const safeName = field.fieldName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
        const value = chapterData[safeName]
        if (!value) continue

        switch (field.fieldType) {
          case 'text':
            if (typeof value === 'string' && value.trim()) {
              contentParagraphs.push(value)
            }
            break

          case 'paragraphs':
            if (Array.isArray(value) && value.length > 0) {
              sections.push({
                title: field.fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                paragraphs: value.filter((p: any) => typeof p === 'string' && p.trim()),
                isList: true,
              })
            }
            break

          case 'table': {
            const tableObj = value as Record<string, any>
            const rawRows = Array.isArray(tableObj.rows) ? tableObj.rows : []
            const columns = (field.tableColumns || []).slice(1).map((col: string, i: number) => ({
              key: `col-${i}`,
              label: col,
            }))

            const rows = rawRows.map((r: any) => ({
              label: r.label || '',
              cells: (Array.isArray(r.cells) ? r.cells : []).map((c: string) => c || '—'),
            }))

            if (rows.length > 0) {
              tables.push({
                templateId: `custom-${tmpl.templateId}`,
                tableTitle: tableObj.tableTitle || field.fieldName.replace(/_/g, ' '),
                columns: columns.length > 0 ? columns : [{ key: 'col-0', label: 'Value' }],
                rows,
              })
            }
            break
          }
        }
      }

      chapters.push({
        title: tmpl.displayName,
        description: tmpl.description.slice(0, 200),
        category: tmpl.category || 'other',
        contentParagraphs: contentParagraphs.length > 0 ? contentParagraphs : [tmpl.description],
        sections: sections.length > 0 ? sections : undefined,
        tables: tables.length > 0 ? tables : undefined,
      })

      console.log(`[benefits-import] Assembled custom chapter: "${tmpl.displayName}"`)
    }
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
    const statusRes = await fetchWithRetry(statusUrl, {
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
  const resultRes = await fetchWithRetry(resultUrl, {
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
