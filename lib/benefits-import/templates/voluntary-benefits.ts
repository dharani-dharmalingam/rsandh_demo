/**
 * Additional Voluntary Benefits Chapter Template.
 *
 * Extracts multiple sub-benefits as tabs:
 * - Pet Insurance
 * - Auto & Home Insurance
 * - Identity Protection
 * - Legal Plan
 * (Plus any other voluntary benefits found in the document)
 */

import type { ChapterTemplate } from './types'

export const VOLUNTARY_BENEFITS_TEMPLATE: ChapterTemplate = {
    id: 'voluntary-benefits',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            voluntary_benefits_chapter: {
                type: 'object',
                description: 'Extract all content from the Additional Voluntary Benefits chapter. Each main benefit (Pet, Auto, etc.) should be extracted as a separate item in the benefits array.',
                properties: {
                    introTitle: { type: 'string', description: 'Main chapter title, e.g., "Additional Voluntary Benefits"' },
                    introDescription: { type: 'string', description: 'Intro paragraph explaining that RS&H offers various voluntary benefits.' },
                    benefits: {
                        type: 'array',
                        description: 'List of voluntary benefits. Each will be rendered as a tab.',
                        items: {
                            type: 'object',
                            properties: {
                                tabTitle: {
                                    type: 'string',
                                    description: 'Short title for the tab, e.g., "Pet Partners", "Auto & Home", "Identity Protection", "Legal Plan".',
                                },
                                providerName: {
                                    type: 'string',
                                    description: 'Provider name if mentioned. e.g., "The Hartford", "Allstate", "MetLaw".',
                                },
                                about: {
                                    type: 'string',
                                    description: 'The "About this insurance" or general description section.',
                                },
                                howItWorks: {
                                    type: 'string',
                                    description: 'The "How it works" or enrollment process section.',
                                },
                                coverageDetails: {
                                    type: 'array',
                                    description: 'List of specific coverage features or bullet points.',
                                    items: { type: 'string' },
                                },
                                quoteLink: {
                                    type: 'string',
                                    description: 'URL or instruction on where to get a quote/enroll, e.g., "petinsurance.com/rsh".',
                                },
                            },
                            required: ['tabTitle', 'about'],
                        },
                    },
                },
            },
        }
    },
}
