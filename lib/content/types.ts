// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PortableTextContent = any[];

// ── Shared types ──

export interface QuickLink {
  label: string;
  href: string;
}

export interface QuickAccessCard {
  title: string;
  description: string;
  href: string;
  iconName?: string;
}

export interface ContactItem {
  label: string;
  value: string;
  href?: string;
}

// ── Table types (used in benefit chapters) ──

export interface TableColumn {
  _key: string;
  key: string;
  label: string;
  subLabel?: string;
}

export interface TableRow {
  _key: string;
  label: string;
  cells: string[];
  isSection?: boolean;
}

export interface BenefitTable {
  _key: string;
  tableTitle: string;
  tableDescription?: string;
  templateId?: string;
  columns: TableColumn[];
  rows: TableRow[];
}

// ── Tab types (used in benefit chapter content) ──

export interface TabItem {
  _key: string;
  title: string;
  content: PortableTextContent;
  link?: string;
  linkLabel?: string;
}

// ── Client ──

export interface ClientData {
  name: string;
  slug: string;
  logoLeft?: string;
  logoRight?: string;
  themeColor?: string;
}

// ── Site Settings ──

export interface SiteSettingsData {
  clientName: string;
  shortName?: string;
  clientLogo?: string;
  logoText?: string;
  footerAbout?: string;
  quickLinks?: QuickLink[];
  quickAccess?: QuickAccessCard[];
  contactInfo?: ContactItem[];
  footerContactTitle?: string;
  footerContactDescription?: string;
  copyrightText?: string;
}

// ── Benefits Page (overview) ──

export interface BenefitsPageData {
  title: string;
  description: string;
}

// ── Benefit Chapter ──

export interface BenefitChapterData {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  icon?: string;
  image?: string;
  content?: PortableTextContent;
  tables?: BenefitTable[];
  order?: number;
}

// ── Open Enrollment ──

export interface OpenEnrollmentData {
  title: string;
  description: string;
  startDate?: string;
  endDate?: string;
  enrollmentLink?: string;
  benefitsGuideUrl?: string;
  videoUrl?: string;
  daysLeftLabel?: string;
  periodLabel?: string;
  statusTitle?: string;
  statusDescription?: string;
  checklistLabel?: string;
  checklistSubtext?: string;
  changesLabel?: string;
  changesSubtext?: string;
  enrollLabel?: string;
  enrollSubtext?: string;
}

// ── Benefit Changes Page ──

export interface BenefitChange {
  _key: string;
  type: "new" | "update";
  title: string;
  description: PortableTextContent;
}

export interface BenefitChangesPageData {
  title: string;
  description?: PortableTextContent;
  alertMessage?: PortableTextContent;
  changes?: BenefitChange[];
  ctaTitle?: string;
  ctaDescription?: string;
}

// ── Enrollment Checklist ──

export interface ChecklistItem {
  _key: string;
  step: number;
  title: string;
  description: PortableTextContent;
}

export interface EnrollmentChecklistData {
  title: string;
  description?: PortableTextContent;
  items?: ChecklistItem[];
  ctaTitle?: string;
  ctaDescription?: string;
}

// ── Retirement Planning ──

export interface PlanningSection {
  _key: string;
  title: string;
  content: PortableTextContent;
}

export interface RetirementPlanningData {
  heroTitle: string;
  heroDescription?: PortableTextContent;
  featuresTitle?: string;
  sections?: PlanningSection[];
  ctaButtonText?: string;
  heroVideoUrl?: string;
}

// ── Document Hub ──

export interface DocumentData {
  _id: string;
  title: string;
  fileUrl?: string;
  fileSize?: number;
  fileType?: string;
}

// ── Root: unified employer content file ──

export interface EmployerContent {
  client: ClientData;
  siteSettings: SiteSettingsData;
  benefitsPage: BenefitsPageData;
  benefitChapters: BenefitChapterData[];
  openEnrollment: OpenEnrollmentData;
  benefitChangesPage: BenefitChangesPageData;
  enrollmentChecklist: EnrollmentChecklistData;
  retirementPlanning: RetirementPlanningData;
  documents: DocumentData[];
}
