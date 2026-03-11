/**
 * Vision Chapter Template — Flexible extraction for one or multiple plans.
 * 
 * Branches based on ctx.visionPlans.length to provide:
 * 1. Intro text (capture provider and general description)
 * 2. Dynamic row extraction (handles any benefit labels like "Eye Exam", "Frames", etc.)
 * 3. Multi-plan comparison columns if 2+ plans are detected.
 */

import type { ChapterTemplate, SchemaContext } from './types'
import { safeName } from './types'

export const VISION_CHAPTER_TEMPLATE: ChapterTemplate = {
    id: 'vision',

    buildSchemaProperties(ctx: SchemaContext): Record<string, unknown> {
        const isMultiPlan = ctx.visionPlans.length > 1
        const planKey = isMultiPlan ? 'vision_multi_plan' : 'vision_single_plan'

        // Define row properties based on plan count
        const rowProperties: Record<string, unknown> = {
            label: {
                type: 'string',
                description: 'The benefit name exactly as it appears in the row header. e.g., "Eye Exam", "Lenses".'
            }
        }

        if (isMultiPlan) {
            // For 2+ plans, we expect columns for each plan's in/out/freq
            ctx.visionPlans.forEach((plan, idx) => {
                const num = idx + 1
                rowProperties[`plan${num}_in_network`] = {
                    type: 'string',
                    description: `In-network value for plan "${plan}".`
                }
                rowProperties[`plan${num}_out_of_network`] = {
                    type: 'string',
                    description: `Out-of-network value (reimbursement) for plan "${plan}".`
                }
                rowProperties[`plan${num}_frequency`] = {
                    type: 'string',
                    description: `Frequency/Limit for plan "${plan}". (e.g. "Every 12 months")`
                }
            })
        } else {
            // For 1 plan, we expect in/out/freq columns
            rowProperties['in_network'] = { type: 'string', description: 'In-network value.' }
            rowProperties['out_of_network'] = { type: 'string', description: 'Out-of-network value (reimbursement).' }
            rowProperties['frequency'] = { type: 'string', description: 'Frequency/Limit value.' }
        }

        return {
            [planKey]: {
                type: 'object',
                description: `Extract all vision plan details. Plan(s) detected: ${ctx.visionPlans.join(', ') || 'Vision'}.`,
                properties: {
                    introText: {
                        type: 'string',
                        description: 'EXTRACT ALL explanatory paragraphs and provider information appearing ABOVE the benefits table (summaries from Image 4).'
                    },
                    benefitRows: {
                        type: 'array',
                        description: 'Extract every row from the vision benefits comparison table. If "Frequency" is a row or column, capture it in the frequency field.',
                        items: {
                            type: 'object',
                            properties: rowProperties
                        }
                    },
                    footnotes: {
                        type: 'string',
                        description: 'Capture any footnotes or disclaimers appearing BELOW the table (e.g., "* Includes Antireflective...").'
                    }
                }
            }
        }
    },
}
