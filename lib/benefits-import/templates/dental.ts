/**
 * Dental Chapter Template — Flexible extraction for one or multiple plans.
 * 
 * Branches based on ctx.dentalPlans.length to provide:
 * 1. Intro text (missing in previous versions)
 * 2. Dynamic row extraction (handles any benefit labels)
 * 3. Multi-plan comparison columns if 2+ plans are detected.
 */

import type { ChapterTemplate, SchemaContext } from './types'
import { safeName } from './types'

export const DENTAL_CHAPTER_TEMPLATE: ChapterTemplate = {
    id: 'dental',

    buildSchemaProperties(ctx: SchemaContext): Record<string, unknown> {
        const isMultiPlan = ctx.dentalPlans.length > 1
        const planKey = isMultiPlan ? 'dental_multi_plan' : 'dental_single_plan'

        // Define row properties based on plan count
        const rowProperties: Record<string, unknown> = {
            label: {
                type: 'string',
                description: 'The benefit name exactly as it appears in the row header. e.g., "Annual deductible", "Basic services".'
            }
        }

        if (isMultiPlan) {
            // For 2+ plans, we expect columns for each plan's in/out network
            ctx.dentalPlans.forEach((plan, idx) => {
                const num = idx + 1
                rowProperties[`plan${num}_in_network`] = {
                    type: 'string',
                    description: `In-network value for the ${num}${num === 1 ? 'st' : 'nd'} plan ("${plan}").`
                }
                rowProperties[`plan${num}_out_of_network`] = {
                    type: 'string',
                    description: `Out-of-network value for the ${num}${num === 1 ? 'st' : 'nd'} plan ("${plan}").`
                }
            })
        } else {
            // For 1 plan, we just expect in/out columns
            rowProperties['in_network'] = {
                type: 'string',
                description: 'In-network value for this plan.'
            }
            rowProperties['out_of_network'] = {
                type: 'string',
                description: 'Out-of-network value for this plan.'
            }
        }

        return {
            [planKey]: {
                type: 'object',
                description: `Extract all dental plan details. Plan(s) detected: ${ctx.dentalPlans.join(', ') || 'Dental'}.`,
                properties: {
                    introText: {
                        type: 'string',
                        description: 'EXTRACT ALL explanatory paragraphs and provider information appearing ABOVE the benefits table.'
                    },
                    benefitRows: {
                        type: 'array',
                        description: 'Extract every row from the dental benefits comparison table.',
                        items: {
                            type: 'object',
                            properties: rowProperties
                        }
                    }
                }
            }
        }
    },
}
