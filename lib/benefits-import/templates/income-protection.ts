/**
 * Income Protection Chapter Template.
 *
 * Extracts:
 * 1. General Intro
 * 2. Short-Term Disability (STD) section
 *    - Intro bullets
 *    - Comparison Table (Core vs Buy-Up)
 *    - Footnotes
 * 3. Long-Term Disability (LTD) section
 *    - Intro bullets
 *    - Specifics Table
 */

import type { ChapterTemplate } from './types'

export const INCOME_PROTECTION_TEMPLATE: ChapterTemplate = {
    id: 'income-protection',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            income_protection_chapter: {
                type: 'object',
                description: 'Extract all content from the Income Protection / Disability chapter. Organize by STD first, then LTD.',
                properties: {
                    // ── General Intro ──
                    introParagraphs: {
                        type: 'array',
                        description: 'Intro paragraphs about offering both STD and LTD. e.g. ["We offer both...", "This helps replace..."]',
                        items: { type: 'string' }
                    },

                    // ── Short-Term Disability (STD) ──
                    stdTitle: { type: 'string', description: 'Title of the STD section. e.g. "Short-Term Disability Insurance Core Plan".' },
                    stdIntroBullets: {
                        type: 'array',
                        description: 'Bullet points above the STD table.',
                        items: { type: 'string' }
                    },
                    stdTableHeaders: {
                        type: 'array',
                        description: 'Headers for the STD table. e.g. ["Insurance Coverage", "Short-Term Disability Core Plan", "Short-Term Disability Buy-Up Plan*"]',
                        items: { type: 'string' }
                    },
                    stdTableRows: {
                        type: 'array',
                        description: 'Rows for the STD table.',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string', description: 'e.g. "Your cost", "When benefits begin".' },
                                coreValue: { type: 'string', description: 'Value for Core Plan.' },
                                buyUpValue: { type: 'string', description: 'Value for Buy-Up Plan.' }
                            }
                        }
                    },
                    stdFootnote: { type: 'string', description: 'Footnote text below the STD table.' },

                    // ── Long-Term Disability (LTD) ──
                    ltdTitle: { type: 'string', description: 'Title of the LTD section. e.g. "Long term disability insurance".' },
                    ltdIntroBullets: {
                        type: 'array',
                        description: 'Bullet points above the LTD table.',
                        items: { type: 'string' }
                    },
                    ltdTableHeaders: {
                        type: 'array',
                        description: 'Headers for the LTD table. e.g. ["Insurance Coverage", "Long-Term Disability Plan"]',
                        items: { type: 'string' }
                    },
                    ltdTableRows: {
                        type: 'array',
                        description: 'Rows for the LTD table.',
                        items: {
                            type: 'object',
                            properties: {
                                label: { type: 'string', description: 'e.g. "Your cost", "When benefits begin".' },
                                value: { type: 'string', description: 'Value for LTD Plan.' }
                            }
                        }
                    },

                    additionalDetails: {
                        type: 'array',
                        description: 'Any additional notes or paragraphs.',
                        items: { type: 'string' }
                    }
                },
            },
        }
    },
}
