/**
 * Template Registry — Composes all chapter templates into a single schema.
 *
 * This is the main entry point for the template system.
 * buildSchemaFromTemplates() replaces the old hardcoded buildExtractionSchema().
 */

import type { SchemaContext } from './types'
import type { CustomTemplateDefinition } from '../types'
import { STATIC_FIELDS_TEMPLATE } from './static-fields'
import { OVERVIEW_CHAPTER_TEMPLATE } from './overview'
import { ELIGIBILITY_CHAPTER_TEMPLATE } from './eligibility'
import { MEDICAL_CHAPTER_TEMPLATE } from './medical'
import { DENTAL_CHAPTER_TEMPLATE } from './dental'
import { VISION_CHAPTER_TEMPLATE } from './vision'
import { EAP_CHAPTER_TEMPLATE } from './eap'
import { FSA_HSA_CHAPTER_TEMPLATE } from './fsa-hsa'
import { SURVIVOR_BENEFITS_TEMPLATE } from './survivor-benefits'
import { SUPPLEMENTAL_HEALTH_TEMPLATE } from './supplemental-health'
import { INCOME_PROTECTION_TEMPLATE } from './income-protection'
import { FINANCIAL_WELLBEING_TEMPLATE } from './financial-wellbeing'
import { PAID_TIME_OFF_TEMPLATE } from './paid-time-off'
import { VOLUNTARY_BENEFITS_TEMPLATE } from './voluntary-benefits'
import { DYNAMIC_CHAPTERS_TEMPLATE } from './dynamic'
import { buildCustomTemplateSchema } from './custom'

// Re-export types and utilities
export { createSchemaContext } from './types'
export type { SchemaContext, ChapterTemplate } from './types'

/**
 * All registered chapter templates, in the order their properties
 * should appear in the composed schema.
 *
 * To add a new chapter type, create a template file and add it here.
 */
export const ALL_CHAPTER_TEMPLATES = [
    STATIC_FIELDS_TEMPLATE,
    OVERVIEW_CHAPTER_TEMPLATE,
    ELIGIBILITY_CHAPTER_TEMPLATE,
    MEDICAL_CHAPTER_TEMPLATE,
    DENTAL_CHAPTER_TEMPLATE,
    VISION_CHAPTER_TEMPLATE,
    EAP_CHAPTER_TEMPLATE,
    FSA_HSA_CHAPTER_TEMPLATE,
    SURVIVOR_BENEFITS_TEMPLATE,
    SUPPLEMENTAL_HEALTH_TEMPLATE,
    INCOME_PROTECTION_TEMPLATE,
    FINANCIAL_WELLBEING_TEMPLATE,
    PAID_TIME_OFF_TEMPLATE,
    VOLUNTARY_BENEFITS_TEMPLATE,
    DYNAMIC_CHAPTERS_TEMPLATE,  // Must be last — catch-all for unmatched chapters
]

/** IDs of all hardcoded (built-in) templates. Useful for matching chapters in the UI. */
export const BUILTIN_TEMPLATE_IDS = ALL_CHAPTER_TEMPLATES.map(t => t.id)

/**
 * Build a complete or partial extraction schema by composing template schemas.
 * Optionally includes user-defined custom templates alongside the built-in ones.
 */
export function buildSchemaFromTemplates(
    ctx: SchemaContext,
    templateIds?: string[],
    customTemplates?: CustomTemplateDefinition[]
): Record<string, unknown> {
    const allProperties: Record<string, unknown> = {}

    for (const template of ALL_CHAPTER_TEMPLATES) {
        if (templateIds && !templateIds.includes(template.id)) {
            continue
        }
        const templateProps = template.buildSchemaProperties(ctx)
        Object.assign(allProperties, templateProps)
    }

    if (customTemplates?.length) {
        for (const custom of customTemplates) {
            if (templateIds && !templateIds.includes(`custom:${custom.templateId}`)) {
                continue
            }
            const customProps = buildCustomTemplateSchema(custom)
            Object.assign(allProperties, customProps)
        }
    }

    return {
        type: 'object',
        description: 'Extract ALL benefit information from this employee benefits guide. Use the structured fields below for each section.',
        properties: allProperties,
        required: ['companyName'],
    }
}
