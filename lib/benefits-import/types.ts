/**
 * Structured extraction output from LlamaExtract.
 * Matches the JSON schema sent to the extraction API.
 */

export type BenefitCategory =
  | 'eligibility' | 'overview' | 'medical' | 'hdhp' | 'hmo' | 'ppo'
  | 'dental' | 'vision' | 'fsa-hsa' | 'hsa' | 'eap' | 'supplemental'
  | 'disability' | 'life-insurance' | 'retirement'
  | 'pet-insurance' | 'college-savings' | 'wellness'
  | 'paid-time-off' | 'voluntary-benefits' | 'other'

export interface ExtractedPlanDetailRow {
  label: string
  description?: string
  inNetwork?: string
  outOfNetwork?: string
  frequency?: string
  isSection?: boolean
  spanColumns?: boolean
}

export interface ExtractedPlanDetailTable {
  tableTitle: string
  tableDescription?: string
  rows: ExtractedPlanDetailRow[]
}

export interface ExtractedPremiumTier {
  tierName: string
  amount: string
}

export interface ExtractedPremiumTable {
  planName: string
  sectionTitle: string
  sectionDescription?: string
  tiers: ExtractedPremiumTier[]
}

export interface ExtractedChapterSection {
  title: string
  paragraphs: string[]
}

export interface ExtractedDynamicTableRow {
  cells: string[]
  isSection?: boolean
}

export interface ExtractedDynamicTable {
  tableTitle: string
  tableDescription?: string
  headers: string[]
  rows: ExtractedDynamicTableRow[]
}

export interface ExtractedChapter {
  title: string
  description: string
  category: BenefitCategory | string
  contentParagraphs: string[]
  sections?: ExtractedChapterSection[]
  planDetails?: ExtractedPlanDetailTable[]
  premiumTables?: ExtractedPremiumTable[]
  dynamicTables?: ExtractedDynamicTable[]
}

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
  enrollmentChecklist?: ExtractedChecklistItem[]
  benefitChanges?: ExtractedBenefitChange[]
  contactInfo?: ExtractedContactInfo[]
  quickLinks?: ExtractedQuickLink[]
  quickAccess?: ExtractedQuickAccessItem[]
}
