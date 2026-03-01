/**
 * Global Table Templates — Pre-defined table skeletons for benefit chapters.
 *
 * Templated chapters have fixed row labels; extraction only fills in values.
 * Dynamic chapters have no template; rows & headers are extracted from the PDF.
 */

// ── Types ──

export interface TemplateRow {
    label: string
    isSection?: boolean   // If true, rendered as a dark section-header row
}

export interface TableTemplate {
    templateId: string
    tableTitle: string
    /** Description template — use {{planName}} as placeholder for the plan name */
    tableDescriptionTemplate?: string
    /**
     * Column mode:
     * - "per-plan-in-out": Each detected plan gets In-Network + Out-of-Network sub-columns
     * - "per-plan-single": Each detected plan gets a single value column
     * - "single-plan":     One value column for the specific plan (used in per-plan chapters)
     * - "fixed-two-col":   Fixed two-column layout (label + value) — no plan columns
     */
    columnType: 'per-plan-in-out' | 'per-plan-single' | 'single-plan' | 'fixed-two-col'
    rows: TemplateRow[]
}

export interface ChapterTableTemplate {
    tables: TableTemplate[]
}

// ── Chapter Templates ──

/**
 * Overview of Available Plans — 3 premium comparison tables.
 * Columns are auto-detected plan names. Rows are coverage tiers.
 */
const OVERVIEW_TEMPLATE: ChapterTableTemplate = {
    tables: [
        {
            templateId: 'overview-medical',
            tableTitle: 'Medical Plans',
            tableDescriptionTemplate: 'Bi-weekly associate payroll contributions for medical coverage.',
            columnType: 'per-plan-single',
            rows: [
                { label: 'Employee Only' },
                { label: 'Employee + Spouse' },
                { label: 'Employee + Child(ren)' },
                { label: 'Family' },
            ],
        },
        {
            templateId: 'overview-dental',
            tableTitle: 'Dental Plans',
            tableDescriptionTemplate: 'Bi-weekly associate payroll contributions for dental coverage.',
            columnType: 'per-plan-single',
            rows: [
                { label: 'Employee Only' },
                { label: 'Employee + Spouse' },
                { label: 'Employee + Child(ren)' },
                { label: 'Family' },
            ],
        },
        {
            templateId: 'overview-vision',
            tableTitle: 'Vision Plans',
            tableDescriptionTemplate: 'Bi-weekly associate payroll contributions for vision coverage.',
            columnType: 'per-plan-single',
            rows: [
                { label: 'Employee Only' },
                { label: 'Employee + Spouse' },
                { label: 'Employee + Child(ren)' },
                { label: 'Family' },
            ],
        },
    ],
}

/**
 * Medical Plan (per-plan chapter) — 3 tables.
 * One chapter is created per detected medical plan.
 */
const MEDICAL_TEMPLATE: ChapterTableTemplate = {
    tables: [
        // Table 1: Premium Rates
        {
            templateId: 'medical-premiums',
            tableTitle: 'Premium Rates',
            tableDescriptionTemplate: 'Bi-weekly associate payroll contributions for {{planName}} coverage',
            columnType: 'single-plan',
            rows: [
                { label: 'Associate' },
                { label: 'Associate + spouse' },
                { label: 'Associate + child(ren)' },
                { label: 'Family' },
            ],
        },
        // Table 2: Plan Benefits Summary
        {
            templateId: 'medical-benefits',
            tableTitle: 'Plan Benefits Summary',
            tableDescriptionTemplate: 'Comprehensive coverage details for {{planName}} plan',
            columnType: 'single-plan',
            rows: [
                // In-Network section
                { label: 'Annual deductible' },
                { label: 'Out-of-pocket maximum' },
                { label: 'Coinsurance (your share)' },
                { label: 'Preventive care' },
                { label: 'Primary physician office visit' },
                { label: 'Specialist office visit' },
                { label: 'Independent labs' },
                { label: 'Outpatient x-rays' },
                { label: 'Imaging (MRI, CT, PET, etc.)' },
                { label: 'Convenience Clinic Visit' },
                { label: 'Teladoc Virtual Visit' },
                { label: 'Urgent Care Center' },
                { label: 'Emergency Room' },
                { label: 'Inpatient Hospitalization' },
                { label: 'Outpatient Surgery' },
                // Out-of-Network section
                { label: 'Out-of-network Coverage (plus balance billing)', isSection: true },
                { label: 'Annual Deductible' },
                { label: 'Coinsurance (your share)' },
                { label: 'Out-of-pocket maximum' },
            ],
        },
        // Table 3: Prescription Drug Coverage
        {
            templateId: 'medical-rx',
            tableTitle: 'Prescription Drug Coverage',
            tableDescriptionTemplate: 'Prescription costs are determined by the tier assigned to each specific prescription drug.',
            columnType: 'single-plan',
            rows: [
                { label: 'Preventive Medication' },
                { label: 'Pharmacy Deductible' },
                { label: 'Retail (30-day supply)', isSection: true },
                { label: 'Tier one' },
                { label: 'Tier two' },
                { label: 'Tier three' },
                { label: 'Speciality' },
                { label: 'Mail order (90-day supply)', isSection: true },
                { label: 'Tier one' },
                { label: 'Tier two' },
                { label: 'Tier three' },
                { label: 'Speciality' },
            ],
        },
    ],
}

/**
 * Dental Plan — 1 multi-plan comparison table.
 */
const DENTAL_TEMPLATE: ChapterTableTemplate = {
    tables: [
        {
            templateId: 'dental-benefits',
            tableTitle: 'Dental',
            columnType: 'per-plan-in-out',
            rows: [
                { label: 'Annual deductible (Individual/Family)' },
                { label: 'Annual maximum (per person)' },
                { label: 'Diagnostic and preventive care' },
                { label: 'Basic services' },
                { label: 'Major services' },
                { label: 'Orthodontia*' },
                { label: 'Lifetime maximum' },
            ],
        },
    ],
}

/**
 * Vision Plan — 1 multi-plan comparison table with section headers.
 */
const VISION_TEMPLATE: ChapterTableTemplate = {
    tables: [
        {
            templateId: 'vision-benefits',
            tableTitle: 'Vision',
            columnType: 'per-plan-in-out',
            rows: [
                { label: 'Eye Exam (every 12 months)' },
                { label: 'Frames', isSection: true },
                { label: 'New frames' },
                { label: 'Lenses (every 12 months)', isSection: true },
                { label: 'Single' },
                { label: 'Bifocal' },
                { label: 'Trifocal' },
                { label: 'Contact lenses (every 12 months)', isSection: true },
                { label: 'Elective' },
                { label: 'Medically necessary' },
            ],
        },
    ],
}

// ── Registry ──

/**
 * Map of chapter category → table template.
 * Chapters not listed here use dynamic table extraction.
 */
export const TABLE_TEMPLATES: Record<string, ChapterTableTemplate> = {
    overview: OVERVIEW_TEMPLATE,
    medical: MEDICAL_TEMPLATE,
    // Individual medical plan types share the same template
    ppo: MEDICAL_TEMPLATE,
    hdhp: MEDICAL_TEMPLATE,
    hmo: MEDICAL_TEMPLATE,
    dental: DENTAL_TEMPLATE,
    vision: VISION_TEMPLATE,
}

/**
 * Categories that use dynamic table extraction (no fixed template).
 * All categories NOT in TABLE_TEMPLATES are dynamic by default.
 */
export const DYNAMIC_CATEGORIES = [
    'fsa-hsa',
    'hsa',
    'disability',
    'life-insurance',
    'eap',
    'eligibility',
    'supplemental',
    'retirement',
    'pet-insurance',
    'college-savings',
    'wellness',
    'paid-time-off',
    'voluntary-benefits',
    'other',
] as const

/**
 * Check if a chapter category should use templated tables.
 */
export function isTemplatedCategory(category: string): boolean {
    return category in TABLE_TEMPLATES
}

/**
 * Get the template for a chapter category, or null if dynamic.
 */
export function getTemplate(category: string): ChapterTableTemplate | null {
    return TABLE_TEMPLATES[category] ?? null
}

/**
 * Build table description by replacing {{planName}} placeholder.
 */
export function buildTableDescription(template: string, planName: string): string {
    return template.replace(/\{\{planName\}\}/g, planName)
}
