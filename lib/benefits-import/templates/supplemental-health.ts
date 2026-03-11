/**
 * Supplemental Health Chapter Template.
 *
 * Extracts (in order):
 * 1. General Intro ("What is supplemental health")
 * 2. Provider Name
 * 3. Critical Illness Coverage (description bullets)
 * 4. Covered Illness List (bullet points)
 * 5. Payment Frequency (bullet points)
 * 6. Associate Cost Summary (Benefit amount table)
 * 7. Accident Coverage (description bullets)
 * 8. Coverage Details (Payout amount table)
 * 9. Payroll Contributions (Cost table)
 */

import type { ChapterTemplate } from './types'

export const SUPPLEMENTAL_HEALTH_TEMPLATE: ChapterTemplate = {
    id: 'supplemental-health',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            supplemental_health_chapter: {
                type: 'object',
                description: 'Extract all content from the Supplemental Health / Voluntary Benefits chapter (Critical Illness and Accident Insurance).',
                properties: {
                    // ── General Intro ──
                    introParagraphs: {
                        type: 'array',
                        description: 'Intro paragraphs about what supplemental health is. e.g. "Our medical plans offer...", "These plans work alongside..."',
                        items: { type: 'string' }
                    },
                    providerName: {
                        type: 'string',
                        description: 'Provider name. e.g. "Mutual of Omaha".'
                    },

                    // ── Critical Illness ──
                    criticalIllnessCoverageBullets: {
                        type: 'array',
                        description: 'Bullet points explaining Critical Illness coverage.',
                        items: { type: 'string' }
                    },
                    coveredIllnessList: {
                        type: 'array',
                        description: 'List of covered illnesses. e.g. ["Cancer", "Heart Attack", ...]',
                        items: { type: 'string' }
                    },
                    paymentFrequencyBullets: {
                        type: 'array',
                        description: 'Bullet points explaining payment frequency (different vs same diagnoses).',
                        items: { type: 'string' }
                    },
                    criticalIllnessCostTable: {
                        type: 'array',
                        description: 'The "Associate cost summary" table for Critical Illness.',
                        items: {
                            type: 'object',
                            properties: {
                                tier: { type: 'string', description: 'e.g. "Associate Only", "Covered Spouse".' },
                                benefit: { type: 'string', description: 'e.g. "$10,000".' }
                            }
                        }
                    },

                    // ── Accident Coverage ──
                    accidentCoverageBullets: {
                        type: 'array',
                        description: 'Bullet points explaining Accident Coverage.',
                        items: { type: 'string' }
                    },
                    accidentPayoutTable: {
                        type: 'array',
                        description: 'The "Coverage Details" table showing payout amounts for injuries/services.',
                        items: {
                            type: 'object',
                            properties: {
                                service: { type: 'string', description: 'e.g. "Urgent Care / X-Ray", "Fracture / Dislocation".' },
                                amount: { type: 'string', description: 'e.g. "$125/$150", "Up to $5,000".' }
                            }
                        }
                    },
                    accidentContributionsTable: {
                        type: 'array',
                        description: 'The "Bi-weekly Associate Payroll Contributions" table for Accident Insurance.',
                        items: {
                            type: 'object',
                            properties: {
                                tier: { type: 'string', description: 'e.g. "Associate Only", "Family".' },
                                cost: { type: 'string', description: 'e.g. "$5.08", "$13.38".' }
                            }
                        }
                    },

                    additionalDetails: {
                        type: 'array',
                        description: 'Any other paragraphs or notes like disclaimers at the bottom.',
                        items: { type: 'string' }
                    }
                },
            },
        }
    },
}
