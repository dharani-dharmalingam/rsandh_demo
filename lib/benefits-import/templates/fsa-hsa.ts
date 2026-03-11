/**
 * FSA & HSA Chapter Template — Complete restructure.
 *
 * Extracts (in order):
 * ── HSA ──
 * 1. Definition (bullet points)
 * 2. Benefits of HSA (bullet points)
 * 3. Eligibility criteria (bullet points)
 * 4. How to manage your HSA account (bullet points)
 * 5. Employer Contribution TABLE (dynamic rows × dynamic cols)
 * 6. Contribution Limits TABLE (Coverage Type × Limit)
 * 7. Eligible expenses (bullet points)
 *
 * ── FSA ──
 * 8. FSA Definition (paragraph)
 * 9. FSA Types Comparison TABLE (Healthcare / Limited Purpose / Dependent Care)
 * 10. Understanding different types of FSAs (content with sub-sections)
 *
 * ── Transit & Parking FSA (optional) ──
 * 11. Transit FSA definition + table
 * 12. Parking FSA definition + table (if present)
 */

import type { ChapterTemplate } from './types'

export const FSA_HSA_CHAPTER_TEMPLATE: ChapterTemplate = {
    id: 'fsa-hsa',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            fsa_hsa_chapter: {
                type: 'object',
                description: 'Extract ALL content from the HSA and FSA pages. Follow the exact order: HSA first, then FSA, then Transit/Parking FSA.',
                properties: {

                    // ═══════════════════════════════════════
                    // ── HSA SECTION ──
                    // ═══════════════════════════════════════

                    hsaDefinition: {
                        type: 'array',
                        description: 'Extract ALL bullet points under "What is a Health Savings Account?" as an array of strings.',
                        items: { type: 'string' }
                    },

                    hsaBenefits: {
                        type: 'array',
                        description: 'Extract ALL bullet points under "Benefits of HSA". Include sub-bullets as separate items prefixed with "- ".',
                        items: { type: 'string' }
                    },

                    hsaEligibility: {
                        type: 'array',
                        description: 'Extract ALL bullet points under "Who is eligible for an HSA?" as an array of strings.',
                        items: { type: 'string' }
                    },

                    hsaManageAccount: {
                        type: 'array',
                        description: 'Extract ALL bullet points under "How to manage your HSA account". Include sub-bullets as separate items prefixed with "- ".',
                        items: { type: 'string' }
                    },

                    // ── HSA Employer Contribution Table ──
                    hsaEmployerContributionTableTitle: {
                        type: 'string',
                        description: 'Title of the employer contribution table. e.g., "RS&H Employer Contribution".'
                    },
                    hsaEmployerContributionColumns: {
                        type: 'array',
                        description: 'Column headers of the employer contribution table (excluding the row label column). e.g., ["Associates", "All Others"].',
                        items: { type: 'string' }
                    },
                    hsaEmployerContributionRows: {
                        type: 'array',
                        description: 'Each row in the employer contribution table.',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string', description: 'Row label. e.g., "Prime HDHP", "Alternate HDHP".' },
                                cells: {
                                    type: 'array',
                                    description: 'Cell values in the same order as columns. e.g., ["$600", "$1,200"].',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },

                    // ── HSA Contribution Limits Table ──
                    hsaContributionLimitsTableTitle: {
                        type: 'string',
                        description: 'Title of the contribution limits table. e.g., "How much can I contribute?".'
                    },
                    hsaContributionLimitsColumns: {
                        type: 'array',
                        description: 'Column headers of the limits table (excluding row label column). e.g., ["2026 Contribution Limit"].',
                        items: { type: 'string' }
                    },
                    hsaContributionLimitsRows: {
                        type: 'array',
                        description: 'Each row in the contribution limits table.',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string', description: 'Row label. e.g., "Individual", "Family", "Catch-up Contribution (Ages 55+)".' },
                                cells: {
                                    type: 'array',
                                    description: 'Cell values. e.g., ["Up to $4,400"].',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },

                    // ── Eligible Expenses ──
                    hsaEligibleExpenses: {
                        type: 'array',
                        description: 'Extract ALL bullet points under "Eligible expenses".',
                        items: { type: 'string' }
                    },

                    // ═══════════════════════════════════════
                    // ── FSA SECTION ──
                    // ═══════════════════════════════════════

                    fsaDefinition: {
                        type: 'string',
                        description: 'Extract the paragraph under "What is a Flexible Spending Account?" — the full definition text.'
                    },

                    // ── FSA Types Comparison Table ──
                    fsaTypesTableTitle: {
                        type: 'string',
                        description: 'Title above the FSA comparison table if any.'
                    },
                    fsaTypesColumns: {
                        type: 'array',
                        description: 'Column headers for FSA types table. e.g., ["Healthcare FSA", "Limited Purpose FSA", "Dependent Care FSA"].',
                        items: { type: 'string' }
                    },
                    fsaTypesRows: {
                        type: 'array',
                        description: 'Each row in the FSA types comparison table.',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string', description: 'Row label. e.g., "Plan Eligibility", "Annual Contribution Limit", "Description".' },
                                cells: {
                                    type: 'array',
                                    description: 'Cell values in column order.',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },

                    // ── Understanding different types of FSAs ──
                    fsaTypesExplanation: {
                        type: 'array',
                        description: 'Extract ALL paragraphs and bullet points under "Understanding different types of FSAs" or similar heading. Include content like "For HDHP Prime & HDHP Alternate medical plan enrollees:" and its sub-bullets.',
                        items: { type: 'string' }
                    },

                    // ═══════════════════════════════════════
                    // ── TRANSIT & PARKING FSA (optional) ──
                    // ═══════════════════════════════════════

                    transitFsaDefinition: {
                        type: 'array',
                        description: 'Extract ALL bullet points under "Transit FSA" definition section. Leave empty if not present.',
                        items: { type: 'string' }
                    },

                    transitFsaTableTitle: {
                        type: 'string',
                        description: 'Title for the Transit FSA table if present.'
                    },
                    transitFsaColumns: {
                        type: 'array',
                        description: 'Column headers of the Transit FSA table. e.g., ["Eligible Expenses", "Ineligible Expenses", "Numbers and Dates"].',
                        items: { type: 'string' }
                    },
                    transitFsaRows: {
                        type: 'array',
                        description: 'Rows of the Transit FSA table. Each row is a single-cell-per-column layout.',
                        items: {
                            type: 'object',
                            properties: {
                                cells: {
                                    type: 'array',
                                    description: 'Cell values in column order.',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },

                    parkingFsaDefinition: {
                        type: 'array',
                        description: 'Extract ALL bullet points under "Parking FSA" definition section if present. Leave empty if not present.',
                        items: { type: 'string' }
                    },

                    parkingFsaTableTitle: {
                        type: 'string',
                        description: 'Title for the Parking FSA table if present.'
                    },
                    parkingFsaColumns: {
                        type: 'array',
                        description: 'Column headers of the Parking FSA table if present.',
                        items: { type: 'string' }
                    },
                    parkingFsaRows: {
                        type: 'array',
                        description: 'Rows of the Parking FSA table if present.',
                        items: {
                            type: 'object',
                            properties: {
                                cells: {
                                    type: 'array',
                                    description: 'Cell values in column order.',
                                    items: { type: 'string' }
                                }
                            }
                        }
                    },
                },
            },
        }
    },
}
