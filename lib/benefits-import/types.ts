/**
 * Structured extraction output from LlamaExtract.
 * Matches the JSON schema sent to the extraction API.
 *
 * Uses a UNIFIED table type for both templated and dynamic chapters.
 */

export type BenefitCategory =
  | 'eligibility' | 'overview' | 'medical' | 'hdhp' | 'hmo' | 'ppo'
  | 'dental' | 'vision' | 'fsa-hsa' | 'hsa' | 'eap' | 'supplemental'
  | 'disability' | 'life-insurance' | 'retirement'
  | 'pet-insurance' | 'college-savings' | 'wellness'
  | 'paid-time-off' | 'voluntary-benefits' | 'other'

// ── Unified Table Types ──

export interface TableColumn {
  key: string        // e.g., "ppo-in-network"
  label: string      // e.g., "PPO"
  subLabel?: string  // e.g., "In-Network", "Out-of-Network"
}

export interface TableRow {
  label: string
  cells: string[]       // Values in the same order as columns
  isSection?: boolean   // If true, rendered as a dark section-header row
}

export interface ExtractedTable {
  templateId?: string         // Links back to global template (null for dynamic)
  tableTitle: string
  tableDescription?: string
  columns: TableColumn[]
  rows: TableRow[]
}

// ── Chapter Types ──

export interface ExtractedChapterSection {
  title: string
  paragraphs: string[]
}

export interface ExtractedChapter {
  title: string
  description: string
  category: BenefitCategory | string
  contentParagraphs: string[]
  sections?: ExtractedChapterSection[]
  tables?: ExtractedTable[]
}

// ── Plan Detection (Phase 1) ──

export interface DetectedPlans {
  medicalPlans: string[]    // e.g., ["PPO", "Prime HDHP", "Alternate HDHP"]
  dentalPlans: string[]     // e.g., ["Core Plan", "Enhanced Plan"]
  visionPlans: string[]     // e.g., ["Core VSP", "Enhanced VSP"]
  premiumTiers: string[]    // e.g., ["Employee Only", "Employee + Spouse", ...]
}

// ── Other Extracted Types (unchanged) ──

export interface ExtractedChecklistItem {
  title: string
  description: string
}

export interface ExtractedBenefitChange {
  type: 'new' | 'update'
  title: string
  description: string
}

export interface ExtractedContactInfo {
  label: string
  value: string
  href?: string
  groupNumber?: string
}

export interface ExtractedQuickLink {
  label: string
  href: string
}

export interface ExtractedRetirementFeature {
  icon?: string
  title: string
  description: string
}

export interface ExtractedRetirementSection {
  title: string
  content: string
}

export interface ExtractedRetirementPlanning {
  heroTitle: string
  heroDescription: string
  features: ExtractedRetirementFeature[]
  planningTitle: string
  sections: ExtractedRetirementSection[]
  ctaButtonText: string
  heroVideoUrl?: string
}

export interface ExtractedQuickAccessItem {
  title: string
  description: string
  href: string
  iconName?: string
}

export interface ExtractedLandingPage {
  heroTitle: string
  heroSubtitle: string
  explainerVideo: {
    title: string
    description: string
    url?: string
  }
}

export interface ExtractedBenefitsData {
  companyName: string
  themeColor?: string
  landingPage?: ExtractedLandingPage
  retirementPlanning?: ExtractedRetirementPlanning
  chapters: ExtractedChapter[]
  detectedPlans?: DetectedPlans
  enrollmentChecklist?: ExtractedChecklistItem[]
  benefitChanges?: ExtractedBenefitChange[]
  contactInfo?: ExtractedContactInfo[]
  quickLinks?: ExtractedQuickLink[]
  quickAccess?: ExtractedQuickAccessItem[]
}
