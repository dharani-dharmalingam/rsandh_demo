/**
 * Eligibility & Qualifying Life Events Chapter Template.
 *
 * Extracts structured content for:
 * - Eligibility requirements (who can participate)
 * - Eligible dependents (who can be covered)
 * - Enrollment details (open enrollment, new hires)
 * - Qualifying Life Events (common + lesser-known)
 *
 * This is a text-heavy chapter — no tables, just sections with bullet points.
 */

import type { ChapterTemplate } from './types'

export const ELIGIBILITY_CHAPTER_TEMPLATE: ChapterTemplate = {
    id: 'eligibility',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            eligibility_chapter: {
                type: 'object',
                description: 'Extract all content from the Eligibility & Qualifying Life Events chapter/section of the benefits guide.',
                properties: {
                    // ── Eligibility Requirements ──
                    eligibilityIntro: {
                        type: 'string',
                        description: 'Introductory text about eligibility. e.g., "To participate in the company\'s benefits plan, you must be:"',
                    },
                    eligibilityRequirements: {
                        type: 'array',
                        description: 'List of eligibility requirements. e.g., "A full-time or part-time associate who is regularly scheduled to work 20 hours or more per week".',
                        items: { type: 'string' },
                    },

                    // ── Eligible Dependents ──
                    eligibleDependents: {
                        type: 'array',
                        description: 'List of who qualifies as an eligible dependent. e.g., "Spouse or domestic partner", "Children up to 26 years old — includes biological, stepchildren, legally adopted", etc.',
                        items: { type: 'string' },
                    },

                    // ── Enrollment ──
                    enrollmentPoints: {
                        type: 'array',
                        description: 'Key points about enrollment (open enrollment, new hires, etc.). Extract each bullet point as a separate string.',
                        items: { type: 'string' },
                    },

                    // ── Qualifying Life Events ──
                    qleDescription: {
                        type: 'string',
                        description: 'Introductory description text for Qualifying Life Events. e.g., "Changes in your life may permit you to update your coverage at points throughout the year, outside of the open enrollment period."',
                    },
                    qleImportantNotice: {
                        type: 'string',
                        description: 'Important notice/deadline about QLE changes. e.g., "Changes to coverage must be made within 30 days of when the life event occurs. Proof of the life event is required."',
                    },
                    commonQualifyingEvents: {
                        type: 'array',
                        description: 'List of common qualifying life events. e.g., "A change in your legal marital status (marriage, divorce or legal separation)", "A change in dependents through birth or adoption or loss of eligibility".',
                        items: { type: 'string' },
                    },
                    lesserKnownQualifyingEvents: {
                        type: 'array',
                        description: 'List of lesser-known qualifying life events. e.g., "Death in the family (leading to change in dependents or loss of coverage)", "Turning 26 and losing coverage through a parent\'s plan".',
                        items: { type: 'string' },
                    },
                },
            },
        }
    },
}
