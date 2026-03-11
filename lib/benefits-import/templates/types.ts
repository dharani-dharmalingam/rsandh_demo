/**
 * Template Types — Defines the interface for chapter extraction templates.
 *
 * Each template knows how to build a JSON schema fragment for its chapter type.
 * The schema fragments are composed into a single monolithic schema for the LLM.
 */

import type { DetectedPlans } from '../types'

// ── Schema Context (passed to every template's buildSchema) ──

export interface SchemaContext {
    medicalPlans: string[]
    dentalPlans: string[]
    visionPlans: string[]
    premiumTiers: string[]
    chaptersList: string[]
}

/**
 * Create a SchemaContext from DetectedPlans + chaptersList.
 *
 * NOTE: Defaulting of empty arrays is done here for plans only.
 * Premium tiers are passed through as-is — each template applies its
 * own defaults when premiumTiers is empty (matches legacy behavior where
 * medical used 'Associate...' defaults and overview used 'Employee Only...').
 */
export function createSchemaContext(
    plans: DetectedPlans,
    chaptersList: string[] = []
): SchemaContext {
    return {
        medicalPlans: plans.medicalPlans.length > 0 ? plans.medicalPlans : ['Plan'],
        dentalPlans: plans.dentalPlans.length > 0 ? plans.dentalPlans : ['Plan'],
        visionPlans: plans.visionPlans.length > 0 ? plans.visionPlans : ['Plan'],
        premiumTiers: plans.premiumTiers,
        chaptersList,
    }
}

// ── Chapter Template Interface ──

export interface ChapterTemplate {
    /** Unique template identifier, e.g., "overview", "medical", "dental" */
    id: string

    /**
     * Build the JSON schema properties for this chapter.
     * Returns a Record of property-name → JSON schema definition.
     * These get merged into the top-level schema's `properties`.
     */
    buildSchemaProperties: (ctx: SchemaContext) => Record<string, unknown>
}

// ── Utility: safe plan-name key ──

export function safeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
}

// ── Default premium tiers per section ──

/** Default tiers for medical premium tables (matches legacy behavior) */
export const MEDICAL_DEFAULT_TIERS = ['Associate', 'Associate + spouse', 'Associate + child(ren)', 'Family']

/** Default tiers for overview premium tables (matches legacy behavior) */
export const OVERVIEW_DEFAULT_TIERS = ['Employee Only', 'Employee + Spouse', 'Employee + Child(ren)', 'Family']
