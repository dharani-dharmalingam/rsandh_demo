/**
 * Dynamic Chapters Template — Catch-all for non-templated chapters.
 *
 * Generates the `dynamicChapters` array schema that instructs the LLM
 * to extract all chapters not covered by templated sections.
 */

import type { ChapterTemplate, SchemaContext } from './types'

export const DYNAMIC_CHAPTERS_TEMPLATE: ChapterTemplate = {
    id: 'dynamic',

    buildSchemaProperties(ctx: SchemaContext): Record<string, unknown> {
        return {
            dynamicChapters: {
                type: 'array',
                description: `Extract ALL benefit chapters NOT covered by the templated sections above. This includes FSA, HSA, Life Insurance, Disability/Income Protection, EAP, Eligibility, and any other benefit sections. For each chapter, extract ALL tables exactly as they appear in the PDF.
${ctx.chaptersList.length > 0 ? `\nSPECIFIC CHAPTERS TO EXTRACT: ${ctx.chaptersList.join(', ')}\n` : ''}
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
        }
    },
}
