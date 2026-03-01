/**
 * Stage 1 – PDF → LlamaExtract → Structured JSON.
 * Server-side only. Uses LLAMA_CLOUD_API_KEY.
 *
 * Uses the LlamaExtract stateless extraction endpoint which accepts
 * a JSON schema + file data and returns structured data in one step.
 */

import type { ExtractedBenefitsData } from './types'

const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai'

export type ExtractOptions = {
  apiKey: string
  pollIntervalMs?: number
  maxWaitMs?: number
}

/**
 * JSON Schema that tells LlamaExtract exactly what fields to extract
 * from a benefits guide PDF. Descriptions guide the LLM extraction.
 */
const EXTRACTION_SCHEMA = {
  type: 'object',
  description: 'Extract ALL benefit sections from this employee benefits guide. Tables MUST be extracted as structured objects in planDetails and premiumTables — NEVER as raw text in contentParagraphs.',
  properties: {
    companyName: {
      type: 'string',
      description: 'The name of the company or organization whose benefits guide this is.',
    },
    themeColor: {
      type: 'string',
      description: 'The primary brand color of the company in hex format (e.g. #D31145). Extract from logos, headers, or dominant colors in the document. If not detectable, return null.',
    },
    landingPage: {
      type: 'object',
      description: 'Key headlines and marketing content for the landing page hero and video sections.',
      properties: {
        heroTitle: { type: 'string', description: 'Main greeting on the homepage, e.g. "Welcome to your Total Rewards Hub".' },
        heroSubtitle: { type: 'string', description: 'Subheader text, e.g. "Your Rewards. Your Journey. Our Shared Future."' },
        explainerVideo: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Title for the explainer video section.' },
            description: { type: 'string', description: 'Short description text about the video guide.' },
            url: { type: 'string', description: 'YouTube or Vimeo link if mentioned in the document.' },
          }
        }
      }
    },
    retirementPlanning: {
      type: 'object',
      description: 'Details about retirement planning, 401(k) transitions, or Fidelity updates if mentioned.',
      properties: {
        heroTitle: { type: 'string', description: 'Title for the retirement section.' },
        heroDescription: { type: 'string', description: 'Overview description of retirement benefits.' },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              icon: { type: 'string', description: 'Suggested icon: trending-up, dollar-sign, target, chart.' },
              title: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        planningTitle: { type: 'string', description: 'Heading for specific planning steps.' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' }
            }
          }
        },
        ctaButtonText: { type: 'string', description: 'Text for the learn more button.' },
        heroVideoUrl: { type: 'string' }
      }
    },
    chapters: {
      type: 'array',
      description: `Each major benefit section/chapter from the guide.

CRITICAL: You MUST always create an "Overview of Available Plans" chapter (category: "overview") as the FIRST chapter. This chapter summarizes ALL available plan options. Its planDetails array MUST contain separate tables for each benefit type found:
- "Medical Plans" table: list all medical plan options as planColumns, with rows for coverage tiers (e.g., Employee, Employee + Spouse, Employee + Children, Family) and their bi-weekly premium costs as planValues.
- "Dental Plans" table: list all dental plan options as planColumns with the same coverage tier rows.
- "Vision Plans" table: list all vision plan options as planColumns with the same coverage tier rows.
Each table should have a tableDescription with the provider name and number of plans (e.g., "Medical benefits provided by BlueCross BlueShield. 3 medical plans available: PPO, Prime HDHP, Alternate HDHP").
Use planColumns for the plan names and planValues for each row's per-plan values.

CRITICAL: You MUST extract FSA and HSA sections. PDFs may contain any combination of these:
- A standalone FSA section → create a chapter titled "Flexible Spending Accounts (FSA)" with category "fsa-hsa"
- A standalone HSA section → create a chapter titled "Health Savings Account (HSA)" with category "hsa"
- A combined FSA & HSA or "FSA vs HSA" comparison section → create a chapter titled "FSA & HSA" with category "fsa-hsa"
Do NOT skip these sections. If the PDF mentions FSA or HSA anywhere, you MUST create the corresponding chapter(s).

Other chapters (Medical, Dental, Vision, etc.) should contain their detailed plan benefit tables (deductibles, copays, coinsurance, etc.) as separate chapters.`,

      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: `The title of this benefit chapter/section. Use the following standardized names:
- Eligibility/enrollment/qualifying life events content → "Eligibility & Qualifying Life Events"
- Medical/health plan content → "Medical Plan"
- Dental content → "Dental Plan"
- Vision content → "Vision Plan"
- 401k/retirement/pension content → "Retirement Plan"
- FSA-only content → "Flexible Spending Accounts (FSA)"
- HSA-only content → "Health Savings Account (HSA)"
- Combined FSA & HSA or FSA vs HSA content → "FSA & HSA"
- Life insurance content → "Life Insurance"
- Disability content → "Disability Benefits"
- EAP content → "Employee Assistance Program (EAP)"
- Overview/summary of all plans → "Overview of Available Plans"
For other sections, use the exact heading from the document. Do NOT use generic titles like "General Information" or "Introduction".`,
          },
          description: {
            type: 'string',
            description: 'A 1-2 sentence summary of what this chapter covers.',
          },
          category: {
            type: 'string',
            description: 'One of: eligibility, overview, medical, hdhp, hmo, ppo, dental, vision, fsa-hsa, eap, supplemental, disability, life-insurance, retirement, other. Use "overview" for general summary sections.',
          },
          contentParagraphs: {
            type: 'array',
            description: 'The introductory body text content of this chapter, broken into natural paragraphs. Extract exactly as written.',
            items: { type: 'string' },
          },
          sections: {
            type: 'array',
            description: 'Structured sub-sections within the chapter. If the chapter has sub-headings (e.g., "Virtual Visits", "Preventive Care"), extract them here.',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'The heading or sub-title of the section.' },
                paragraphs: { type: 'array', items: { type: 'string' }, description: 'The text paragraphs under this heading.' }
              }
            }
          },
          planDetails: {
            type: 'array',
            description: 'Grouped plan detail tables. Each entry is a separate table. If the table compares multiple plans side-by-side (e.g., Core Plan vs Enhanced Plan), use planColumns and planValues. Otherwise use inNetwork/outOfNetwork. Capture every row exactly as seen. DO NOT hallucinate or summarize values.',
            items: {
              type: 'object',
              properties: {
                tableTitle: { type: 'string', description: 'The title of this specific table (e.g. "Dental", "Vision").' },
                tableDescription: { type: 'string', description: 'Optional introductory text for this specific table.' },
                planColumns: {
                  type: 'array',
                  description: 'For multi-plan comparison tables: define each plan as a column. e.g., [{planName: "Core Plan", subtitle: "formerly Preferred Plan"}, {planName: "Enhanced Plan", subtitle: "formerly Choice Plan"}]. Leave empty/null for single-plan tables.',
                  items: {
                    type: 'object',
                    properties: {
                      planName: { type: 'string', description: 'Plan name shown in the column header.' },
                      subtitle: { type: 'string', description: 'Optional subtitle, e.g., "formerly Preferred Plan".' },
                    },
                    required: ['planName'],
                  },
                },
                rows: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string', description: 'The row label or feature name. Extract literally.' },
                      description: { type: 'string', description: 'Supplementary info or sub-text for the row.' },
                      inNetwork: { type: 'string', description: 'In-network value (single-plan tables only). Use "—" if empty.' },
                      outOfNetwork: { type: 'string', description: 'Out-of-network value (single-plan tables only). Use "—" if empty.' },
                      frequency: { type: 'string', description: 'Value from a frequency column (if exists).' },
                      isSection: { type: 'boolean', description: 'Set true if this row is a visual section separator or category header within the table.' },
                      spanColumns: { type: 'boolean', description: 'Set true if the value should span across all plan columns.' },
                      planValues: {
                        type: 'array',
                        description: 'For multi-plan tables: provide one entry per planColumn, in the same order. Each entry has inNetwork and outOfNetwork values for that plan.',
                        items: {
                          type: 'object',
                          properties: {
                            inNetwork: { type: 'string', description: 'In-network value for this plan.' },
                            outOfNetwork: { type: 'string', description: 'Out-of-network value for this plan.' },
                          },
                        },
                      },
                    },
                    required: ['label'],
                  }
                }
              },
              required: ['tableTitle', 'rows'],
            },
          },
          premiumTables: {
            type: 'array',
            description: 'Premium contribution tables showing costs by coverage tier. Extract literally.',
            items: {
              type: 'object',
              properties: {
                planName: {
                  type: 'string',
                  description: 'The plan name, e.g. "PPO", "HDHP", "Anthem Blue Cross - PPO", "Core Dental Plan", "Enhanced VSP".',
                },
                sectionTitle: {
                  type: 'string',
                  description: 'Title for this premium table section, e.g. "Medical Premiums", "Dental Plan Summary", "Vision Premiums".',
                },
                sectionDescription: {
                  type: 'string',
                  description: 'Description text for this premium table, e.g. "Bi-weekly associate payroll contributions".',
                },
                tiers: {
                  type: 'array',
                  description: 'Each coverage tier row. Common tiers: "Employee Only" / "Associate", "Employee + Spouse" / "Associate + Spouse", "Employee + Child(ren)", "Employee + Family" / "Family". Extract the EXACT tier name and dollar amount.',
                  items: {
                    type: 'object',
                    properties: {
                      tierName: {
                        type: 'string',
                        description: 'Tier name, e.g. "Associate", "Associate + spouse", "Associate + child(ren)", "Family".',
                      },
                      amount: {
                        type: 'string',
                        description: 'Premium amount, e.g. "$91.19", "$3.36", "$0".',
                      },
                    },
                    required: ['tierName', 'amount'],
                  },
                },
              },
              required: ['planName', 'sectionTitle', 'tiers'],
            },
          },
          dynamicTables: {
            type: 'array',
            description: `For NON-OVERVIEW chapters (Medical, Dental, Vision, FSA, HSA, Disability, Life Insurance, etc.), extract ALL tables using this dynamic format. This captures the EXACT table structure from the PDF.

CRITICAL RULES:
1. Extract the table EXACTLY as it appears in the PDF — same columns, same rows, same values. Do NOT restructure, merge, split, or reinterpret the table.
2. Use the EXACT table title from the PDF (e.g., "Dental" not "Dental Plan Benefits"). If the PDF table has a title/header row, use that verbatim.
3. For tables with TWO-LEVEL HEADERS (e.g., a top header row with plan names like "Core Plan (formerly Preferred Plan)" spanning two sub-columns "In-network" and "Out-of-network"), flatten them into headers by combining the parent and child: e.g., "Core Plan (formerly Preferred Plan) In-network", "Core Plan (formerly Preferred Plan) Out-of-network". Keep the EXACT plan name text from the PDF including any parenthetical notes like "(formerly Preferred Plan)".
4. The first header should be the row label column name exactly as in the PDF (e.g., "Dental", "Vision", "Service", or whatever the PDF uses).
5. Extract EVERY row with cell values in the same order as headers. Do NOT skip rows or merge cells. Use "—" for empty cells.
6. Do NOT use this for overview/summary chapters — those use planDetails with planColumns/planValues.

Example: If the PDF has a dental table with header row "Dental | Core Plan (formerly Preferred Plan) [In-network, Out-of-network] | Enhanced Plan (formerly Choice Plan) [In-network, Out-of-network]", the headers array should be:
["Dental", "Core Plan (formerly Preferred Plan) In-network", "Core Plan (formerly Preferred Plan) Out-of-network", "Enhanced Plan (formerly Choice Plan) In-network", "Enhanced Plan (formerly Choice Plan) Out-of-network"]`,
            items: {
              type: 'object',
              properties: {
                tableTitle: { type: 'string', description: 'Title of the table EXACTLY as it appears in the PDF. Use the verbatim title text from the document.' },
                tableDescription: { type: 'string', description: 'Optional description text above the table, extracted verbatim from the PDF.' },
                headers: {
                  type: 'array',
                  description: 'Column headers preserving the exact structure from the PDF. For two-level headers, combine parent + child (e.g., "Core Plan (formerly Preferred Plan) In-network"). Include ALL columns.',
                  items: { type: 'string' },
                },
                rows: {
                  type: 'array',
                  description: 'Table rows exactly as they appear in the PDF. Each row has cells matching the headers order.',
                  items: {
                    type: 'object',
                    properties: {
                      cells: {
                        type: 'array',
                        description: 'Cell values in the exact same order as headers. Use "—" for empty cells.',
                        items: { type: 'string' },
                      },
                      isSection: { type: 'boolean', description: 'Set true if this row is a section separator or category header within the table.' },
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
    enrollmentChecklist: {
      type: 'array',
      description: 'Step-by-step enrollment checklist items. If the document mentions enrollment steps, extract them. Otherwise, generate reasonable steps based on the available benefits.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short title for this step.' },
          description: { type: 'string', description: 'Description of what to do in this step.' },
        },
        required: ['title', 'description'],
      },
    },
    benefitChanges: {
      type: 'array',
      description: 'Any changes, updates, or new benefits mentioned in the document for the current plan year.',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'Either "new" for new benefits or "update" for changes to existing benefits.' },
          title: { type: 'string', description: 'Title of the change.' },
          description: { type: 'string', description: 'Description of what changed.' },
        },
        required: ['type', 'title', 'description'],
      },
    },
    contactInfo: {
      type: 'array',
      description: 'Contact information found in the document: HR department phone/email, provider contact numbers, group numbers, etc.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Label, e.g. "Medical Plan - Anthem BCBS", "HR Benefits Hotline".' },
          value: { type: 'string', description: 'Primary value like phone number or email.' },
          href: { type: 'string', description: 'Link URL if applicable (mailto:, tel:, or https://).' },
          groupNumber: { type: 'string', description: 'Provider group number if found.' }
        },
        required: ['label', 'value'],
      },
    },
    quickLinks: {
      type: 'array',
      description: 'Standard navigation links for the footer: Home, Chapters, Document Hub, etc. Only extract URLs that link to pages.',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string', description: 'Display label for the link.' },
          href: { type: 'string', description: 'Full URL.' },
        },
        required: ['label', 'href'],
      },
    },
    quickAccess: {
      type: 'array',
      description: 'Prominent dashboard-style cards for the Quick Access section. Look for employee portals (UKG, Workday), Support/Contact Us cards, and Document Hub access.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short title. e.g. "UKG", "Contact Us".' },
          description: { type: 'string', description: 'Short description text.' },
          href: { type: 'string', description: 'The main link URL.' },
          iconName: { type: 'string', description: 'Suggested icon: building (for portals), message-square (for support), file-text (for docs).' },
        },
        required: ['title', 'description', 'href'],
      }
    }
  },
  required: ['companyName', 'chapters'],
}

/**
 * Extract structured benefits data from a PDF using LlamaExtract.
 *
 * Uses the stateless extraction endpoint — no agent pre-creation needed.
 * The extraction schema tells the LLM exactly what fields to extract.
 */
export async function extractBenefitsGuide(
  pdfBuffer: Buffer,
  options: ExtractOptions
): Promise<ExtractedBenefitsData> {
  const { apiKey, pollIntervalMs = 5000, maxWaitMs = 600_000 } = options

  if (!apiKey?.trim()) {
    throw new Error('LLAMA_CLOUD_API_KEY is required for extraction')
  }

  // Convert PDF buffer to base64 for the stateless extraction endpoint
  const base64File = pdfBuffer.toString('base64')

  // Call the stateless extraction endpoint
  const extractUrl = `${LLAMA_API_BASE}/api/v1/extraction/run`
  console.log('[benefits-import] Starting LlamaExtract structured extraction...')

  const extractRes = await fetch(extractUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data_schema: EXTRACTION_SCHEMA,
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

  // Handle async job response — poll for completion if we get a job ID
  if (result.id || result.job_id) {
    const jobId = (result.id ?? result.job_id) as string
    console.log(`[benefits-import] LlamaExtract job started: ${jobId}`)
    return await pollForResults(jobId, apiKey, pollIntervalMs, maxWaitMs)
  }

  // Handle synchronous response — data is returned directly
  if (result.data) {
    console.log('[benefits-import] LlamaExtract returned data synchronously')
    return validateExtraction(result.data as ExtractedBenefitsData)
  }

  // If the result itself looks like extracted data
  if (result.companyName || result.chapters) {
    console.log('[benefits-import] LlamaExtract returned data directly')
    return validateExtraction(result as unknown as ExtractedBenefitsData)
  }

  throw new Error('LlamaExtract returned an unexpected response format')
}

/**
 * Poll a LlamaExtract job for completion and return results.
 * Retries up to 3 times on transient 5xx errors before giving up.
 */
async function pollForResults(
  jobId: string,
  apiKey: string,
  pollIntervalMs: number,
  maxWaitMs: number
): Promise<ExtractedBenefitsData> {
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
      // Retry on transient 5xx errors
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

    // Reset error counter on success
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
      // Try to get data from the status response itself
      const data = statusData.result ?? statusData.data
      if (data) {
        return validateExtraction(data as ExtractedBenefitsData)
      }
      // Otherwise fetch the result separately
      return await fetchJobResults(jobId, apiKey)
    }

    if (status === 'FAILED' || status === 'CANCELLED' || status === 'ERROR') {
      throw new Error(
        statusData.error_message ?? `LlamaExtract job ${status}`
      )
    }

    if (Date.now() - start > maxWaitMs) {
      throw new Error(
        `LlamaExtract job timed out after ${Math.round(maxWaitMs / 60000)} minutes. Try a smaller PDF or try again later.`
      )
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs))
  }
}

/**
 * Fetch results for a completed extraction job.
 */
async function fetchJobResults(
  jobId: string,
  apiKey: string
): Promise<ExtractedBenefitsData> {
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
  const data = resultJson.data ?? resultJson.result ?? resultJson
  return validateExtraction(data as ExtractedBenefitsData)
}

/**
 * Validate and normalize the extracted data.
 */
function validateExtraction(data: ExtractedBenefitsData): ExtractedBenefitsData {
  if (!data || typeof data !== 'object') {
    throw new Error('LlamaExtract returned invalid data')
  }

  // Handle cases where the data might be wrapped
  const dataAsAny = data as unknown as Record<string, unknown>
  const extracted = dataAsAny.extraction
    ? (dataAsAny.extraction as ExtractedBenefitsData)
    : data

  if (!extracted.companyName && !extracted.chapters) {
    throw new Error(
      'LlamaExtract returned data but no companyName or chapters were found. The PDF may not be a benefits guide.'
    )
  }

  // Ensure chapters is an array
  if (!Array.isArray(extracted.chapters)) {
    extracted.chapters = []
  }

  // Default companyName if missing
  if (!extracted.companyName) {
    extracted.companyName = 'Unknown Company'
  }

  console.log(
    `[benefits-import] Extracted: "${extracted.companyName}" with ${extracted.chapters.length} chapters, ` +
    `${extracted.enrollmentChecklist?.length ?? 0} checklist items, ` +
    `${extracted.benefitChanges?.length ?? 0} benefit changes, ` +
    `${extracted.contactInfo?.length ?? 0} contacts, ` +
    `${extracted.quickLinks?.length ?? 0} quick links. ` +
    `Chapters: ${extracted.chapters.map(c => c.title).join(', ')}`
  )

  return extracted
}
