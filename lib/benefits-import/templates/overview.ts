/**
 * Overview Chapter Template — Premium comparison tables + provider info.
 *
 * Generates schema properties for:
 * - overview_medical_info: Provider description + plan count/names
 * - overview_medical_premiums: Premium comparison table values
 * - (same for dental and vision)
 *
 * NOTE: Video is NOT extracted — it's a placeholder added manually.
 */

import type { ChapterTemplate, SchemaContext } from './types'
import { safeName, OVERVIEW_DEFAULT_TIERS } from './types'

export const OVERVIEW_CHAPTER_TEMPLATE: ChapterTemplate = {
    id: 'overview',

    buildSchemaProperties(ctx: SchemaContext): Record<string, unknown> {
        const props: Record<string, unknown> = {}
        const tierNames = ctx.premiumTiers.length > 0 ? ctx.premiumTiers : OVERVIEW_DEFAULT_TIERS

        // ── Per-benefit-type: provider info + premiums ──
        for (const benefitType of ['medical', 'dental', 'vision'] as const) {
            const planNames = benefitType === 'medical' ? ctx.medicalPlans
                : benefitType === 'dental' ? ctx.dentalPlans
                    : ctx.visionPlans

            const label = benefitType.charAt(0).toUpperCase() + benefitType.slice(1)

            // Provider info + plan summary
            props[`overview_${benefitType}_info`] = {
                type: 'object',
                description: `Provider and plan summary information for ${label} benefits.`,
                properties: {
                    providerDescription: {
                        type: 'string',
                        description: `Provider description for ${label} benefits. e.g., "Medical benefits provided by BlueCross BlueShield and include coverage for both in-network and out-of-network providers. All plans participate in the same network, and you may choose your provider." Extract the full sentences about the provider and coverage/network details.`,
                    },
                    providerName: {
                        type: 'string',
                        description: `Name of the ${label} benefits provider. e.g., "BlueCross BlueShield", "MetLife", "VSP (Vision Service Plan)".`,
                    },
                    planCountSummary: {
                        type: 'string',
                        description: `Plan count and names summary line. e.g., "3 medical plans available: PPO Plan, Prime HDHP, Alternate HDHP" or "2 dental plans available: Core Plan and Enhanced Plan". Extract exactly as written in the document.`,
                    },
                },
            }

            // Premium table values
            const tierProps: Record<string, unknown> = {}
            for (const planName of planNames) {
                for (const tier of tierNames) {
                    const key = `${safeName(planName)}_${safeName(tier)}`
                    tierProps[key] = {
                        type: 'string',
                        description: `Premium for "${planName}" at "${tier}" coverage level. e.g., "$159.98"`,
                    }
                }
            }

            props[`overview_${benefitType}_premiums`] = {
                type: 'object',
                description: `Bi-weekly premium contributions for all ${benefitType} plans by coverage tier.`,
                properties: tierProps,
            }
        }

        return props
    },
}
