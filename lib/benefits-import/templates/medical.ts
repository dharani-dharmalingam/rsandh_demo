/**
 * Medical Chapter Template — Per-plan extraction schemas.
 *
 * For each detected medical plan, generates schema properties for:
 * - planOverview, hsaEligible
 * - premiums (per tier)
 * - benefits (in-network / out-of-network for each row)
 * - prescriptionDrug (retail + mail order tiers)
 */

import type { ChapterTemplate, SchemaContext } from './types'
import { safeName, MEDICAL_DEFAULT_TIERS } from './types'

/**
 * Build the benefits in-network / out-of-network properties for a specific plan.
 * Descriptions exactly match the legacy buildExtractionSchema output.
 */
function buildBenefitProperties(planName: string): Record<string, unknown> {
    return {
        annual_deductible_in_network: { type: 'string', description: `In-network Annual deductible for ${planName}. e.g., "$2,000 per person"` },
        annual_deductible_out_of_network: { type: 'string', description: `Out-of-network Annual deductible for ${planName}.` },
        out_of_pocket_maximum_in_network: { type: 'string', description: `In-network Out-of-pocket maximum for ${planName}.` },
        out_of_pocket_maximum_out_of_network: { type: 'string', description: `Out-of-network Out-of-pocket maximum for ${planName}.` },
        coinsurance_in_network: { type: 'string', description: `In-network Coinsurance for ${planName}.` },
        coinsurance_out_of_network: { type: 'string', description: `Out-of-network Coinsurance for ${planName}.` },
        preventive_care_in_network: { type: 'string', description: `In-network Preventive care for ${planName}.` },
        preventive_care_out_of_network: { type: 'string', description: `Out-of-network Preventive care for ${planName}.` },
        primary_physician_office_visit_in_network: { type: 'string', description: `In-network PCP visit for ${planName}.` },
        primary_physician_office_visit_out_of_network: { type: 'string', description: `Out-of-network PCP visit for ${planName}.` },
        specialist_office_visit_in_network: { type: 'string', description: `In-network Specialist visit for ${planName}.` },
        specialist_office_visit_out_of_network: { type: 'string', description: `Out-of-network Specialist visit for ${planName}.` },
        independent_labs_in_network: { type: 'string', description: `In-network Labs for ${planName}.` },
        independent_labs_out_of_network: { type: 'string', description: `Out-of-network Labs for ${planName}.` },
        outpatient_xrays_in_network: { type: 'string', description: `In-network X-rays for ${planName}.` },
        outpatient_xrays_out_of_network: { type: 'string', description: `Out-of-network X-rays for ${planName}.` },
        imaging_in_network: { type: 'string', description: `In-network Imaging (MRI, CT, etc.) for ${planName}.` },
        imaging_out_of_network: { type: 'string', description: `Out-of-network Imaging for ${planName}.` },
        convenience_clinic_visit_in_network: { type: 'string', description: `In-network Convenience Clinic for ${planName}.` },
        convenience_clinic_visit_out_of_network: { type: 'string', description: `Out-of-network Convenience Clinic for ${planName}.` },
        teladoc_virtual_visit_in_network: { type: 'string', description: `In-network Virtual Visit for ${planName}.` },
        teladoc_virtual_visit_out_of_network: { type: 'string', description: `Out-of-network Virtual Visit for ${planName}.` },
        urgent_care_center_in_network: { type: 'string', description: `In-network Urgent Care for ${planName}.` },
        urgent_care_center_out_of_network: { type: 'string', description: `Out-of-network Urgent Care for ${planName}.` },
        emergency_room_in_network: { type: 'string', description: `In-network ER for ${planName}.` },
        emergency_room_out_of_network: { type: 'string', description: `Out-of-network ER for ${planName}.` },
        inpatient_hospitalization_in_network: { type: 'string', description: `In-network Hospitalization for ${planName}.` },
        inpatient_hospitalization_out_of_network: { type: 'string', description: `Out-of-network Hospitalization for ${planName}.` },
        outpatient_surgery_in_network: { type: 'string', description: `In-network Surgery for ${planName}.` },
        outpatient_surgery_out_of_network: { type: 'string', description: `Out-of-network Surgery for ${planName}.` },
    }
}

/**
 * Build prescription drug properties for a specific plan.
 */
function buildRxProperties(planName: string): Record<string, unknown> {
    return {
        preventive_medication: { type: 'string', description: `Preventive medication cost for ${planName}.` },
        pharmacy_deductible: { type: 'string', description: `Pharmacy deductible for ${planName}.` },
        retail_tier_one: { type: 'string', description: `Retail (30-day) Tier 1 cost for ${planName}.` },
        retail_tier_two: { type: 'string', description: `Retail (30-day) Tier 2 cost for ${planName}.` },
        retail_tier_three: { type: 'string', description: `Retail (30-day) Tier 3 cost for ${planName}.` },
        retail_speciality: { type: 'string', description: `Retail (30-day) Speciality cost for ${planName}.` },
        mailorder_tier_one: { type: 'string', description: `Mail order (90-day) Tier 1 cost for ${planName}.` },
        mailorder_tier_two: { type: 'string', description: `Mail order (90-day) Tier 2 cost for ${planName}.` },
        mailorder_tier_three: { type: 'string', description: `Mail order (90-day) Tier 3 cost for ${planName}.` },
        mailorder_speciality: { type: 'string', description: `Mail order (90-day) Speciality cost for ${planName}.` },
    }
}

export const MEDICAL_CHAPTER_TEMPLATE: ChapterTemplate = {
    id: 'medical',

    buildSchemaProperties(ctx: SchemaContext): Record<string, unknown> {
        const props: Record<string, unknown> = {}

        // 1. Common Medical Info (extracted once)
        props[`medical_common_info`] = {
            type: 'object',
            description: 'Extract general medical information applicable to all plans.',
            properties: {
                inNetworkVsOutNetworkTitle: { type: 'string', description: 'Chapter title for In-network vs Out-of-network' },
                inNetworkExplanation: { type: 'array', items: { type: 'string' }, description: 'Bullet points explaining what In-network means.' },
                outOfNetworkExplanation: { type: 'array', items: { type: 'string' }, description: 'Bullet points explaining what Out-of-network means.' },
                networkCheckInstructions: { type: 'string', description: 'Instructions on how to check if a provider is in-network.' },
                helpSectionTitle: { type: 'string', description: 'Title for the help section, e.g. "Help with Selecting Your Medical Coverage"' },
                alexDescription: { type: 'string', description: 'Description of ALEX benefits counselor.' },
                pharmacyInfo: { type: 'string', description: 'Information about pharmacy benefits.' },
                virtualVisitInfo: { type: 'string', description: 'Information about virtual visits.' },
                toolkitAppLink: { type: 'string', description: 'URL or name of the toolkit app.' },
            }
        }

        // 2. Per-Plan Details
        for (const planName of ctx.medicalPlans) {
            const safe = safeName(planName)

            // Premium tier properties
            const premiumProps: Record<string, unknown> = {}
            const tiers = ctx.premiumTiers.length > 0 ? ctx.premiumTiers : MEDICAL_DEFAULT_TIERS
            for (const tier of tiers) {
                premiumProps[safeName(tier)] = {
                    type: 'string',
                    description: `Premium amount for "${tier}" tier under ${planName}. e.g., "$159.98"`,
                }
            }

            props[`medical_${safe}`] = {
                type: 'object',
                description: `Extract ALL values for the "${planName}" medical plan. If a value is not found, use "—".`,
                properties: {
                    planOverview: {
                        type: 'string',
                        description: `Brief overview/description of the ${planName} medical plan.`,
                    },
                    hsaEligible: {
                        type: 'string',
                        description: `Is this plan HSA eligible? e.g., "HSA eligible", "Not HSA eligible".`,
                    },
                    premiums: {
                        type: 'object',
                        description: `Premium rates for ${planName}. Extract the EXACT dollar amounts.`,
                        properties: premiumProps,
                    },
                    terms: {
                        type: 'object',
                        description: `Definitions of medical terms for ${planName}. Include the specific individual/family amounts in the descriptions.`,
                        properties: {
                            copaysDefinition: { type: 'array', items: { type: 'string' }, description: 'Bullet points explaining Copays.' },
                            deductibleDefinition: { type: 'array', items: { type: 'string' }, description: 'Bullet points explaining Deductible (MUST include family $ amounts if mentioned).' },
                            outOfPocketMaxDefinition: { type: 'array', items: { type: 'string' }, description: 'Bullet points explaining Out-of-Pocket Maximum (MUST include family $ amounts if mentioned).' },
                        }
                    },
                    benefits: {
                        type: 'object',
                        description: `Plan Benefits Summary values for ${planName}. Extract In-network and Out-of-network values for every row.`,
                        properties: buildBenefitProperties(planName),
                    },
                    prescriptionDrug: {
                        type: 'object',
                        description: `Prescription Drug Coverage values for ${planName}.`,
                        properties: buildRxProperties(planName),
                    },
                },
            }
        }

        return props
    },
}
