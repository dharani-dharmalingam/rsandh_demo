/**
 * Survivor Benefits Chapter Template.
 *
 * Extracts:
 * - Basic Life & AD&D (employer paid)
 * - Coverage Amount (with age reduction table)
 * - AD&D Coverage specifics (Death/Dismemberment)
 * - Supplemental/Voluntary Life & AD&D
 * - Beneficiary designation info
 */

import type { ChapterTemplate } from './types'

export const SURVIVOR_BENEFITS_TEMPLATE: ChapterTemplate = {
    id: 'survivor-benefits',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            survivor_benefits_chapter: {
                type: 'object',
                description: 'Extract all content from the Survivor Benefits / Life Insurance chapter. Follow the order: Intro, Coverage Amount, AD&D details, and Voluntary benefits.',
                properties: {
                    // ── Intro ──
                    introText: {
                        type: 'string',
                        description: 'Introductory paragraph about eligibility and automatic coverage. e.g. "If you are a full-time or part-time benefits eligible employee..."',
                    },

                    // ── Coverage Amount ──
                    coverageAmountBullets: {
                        type: 'array',
                        description: 'Bullet points under "Coverage amount". e.g. ["Amount of your annual salary...", "At age 65, your life insurance amount begins to reduce..."]',
                        items: { type: 'string' },
                    },
                    ageReductionTable: {
                        type: 'object',
                        description: 'The table showing how coverage reduces at certain ages.',
                        properties: {
                            headers: {
                                type: 'array',
                                description: 'Age headers. e.g. ["65", "70", "75", "80"]',
                                items: { type: 'string' }
                            },
                            values: {
                                type: 'array',
                                description: 'Reduction percentages. e.g. ["35%", "45%", "70%", "80%"]',
                                items: { type: 'string' }
                            },
                        },
                    },

                    // ── AD&D Coverage ──
                    adAndDDescription: {
                        type: 'string',
                        description: 'The paragraph explaining AD&D coverage.',
                    },
                    adAndDBullets: {
                        type: 'array',
                        description: 'The bullet points for Death and Dismemberment under AD&D Coverage.',
                        items: { type: 'string' },
                    },

                    // ── Other Voluntary Benefits ──
                    voluntaryBenefitsDescription: {
                        type: 'string',
                        description: 'The text under "Other Voluntary benefits". e.g. "Please reference full benefits guide for more details"',
                    },
                    voluntaryBenefitsBullets: {
                        type: 'array',
                        description: 'The list of voluntary plans. e.g. ["Voluntary life insurance...", "Voluntary AD&D insurance..."]',
                        items: { type: 'string' },
                    },

                    // ── Legacy Compatibility / Fallback ──
                    basicLifeBenefit: {
                        type: 'string',
                        description: 'Direct amount of basic life benefit if found as a single value.',
                    },
                    beneficiaryNote: {
                        type: 'string',
                        description: 'Any note about designating beneficiaries.',
                    }
                },
            },
        }
    },
}
