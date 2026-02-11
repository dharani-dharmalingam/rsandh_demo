export interface BenefitChapter {
  id: string;
  slug: string;
  title: string;
  description: string;
  fullContent: string;
  image: string;
}

export interface ContactInfo {
  label: string;
  value: string;
  href?: string;
}

export const BENEFIT_CHAPTERS: BenefitChapter[] = [
  {
    id: "document-hub",
    slug: "document-hub",
    title: "Document Hub",
    description: "Access all your important benefits documents in one place.",
    fullContent: "The Document Hub contains all official benefits documentation, plan summaries, and compliance documents. Find and download whatever you need in PDF format.",
    image: "/api/placeholder?w=400&h=300&text=Document+Hub",
  },
  {
    id: "2026-annual-notice",
    slug: "2026-annual-notice",
    title: "2026 Annual Notice",
    description: "Important annual benefits notice for 2026.",
    fullContent: "This annual notice provides updates on benefits changes, new offerings, and important compliance information for 2026. Please review carefully.",
    image: "/api/placeholder?w=400&h=300&text=Annual+Notice",
  },
  {
    id: "overview-of-available-plans",
    slug: "overview-of-available-plans",
    title: "Overview of Available Plans",
    description: "Learn about all the benefit plans available to you.",
    fullContent: "RS&H offers a comprehensive selection of health, wellness, and financial benefit plans. Each plan is designed to meet different needs and preferences.",
    image: "/api/placeholder?w=400&h=300&text=Available+Plans",
  },
  {
    id: "eligibility-qualifying-life-events",
    slug: "eligibility-qualifying-life-events",
    title: "Eligibility & Qualifying Life Events",
    description: "Understand your eligibility and what life events allow changes.",
    fullContent: "Eligibility for benefits depends on your employment status and tenure. Qualifying life events allow you to make changes outside of open enrollment.",
    image: "/api/placeholder?w=400&h=300&text=Eligibility",
  },
  {
    id: "medical-plan-bcbs-ppo",
    slug: "medical-plan-bcbs-ppo",
    title: "Medical Plan - BCBS PPO",
    description: "Flexible preferred provider organization medical coverage.",
    fullContent: "The BCBS PPO plan offers flexibility in choosing healthcare providers while maintaining affordable out-of-pocket costs.",
    image: "/api/placeholder?w=400&h=300&text=Medical+PPO",
  },
  {
    id: "medical-plan-bcbs-prime-hdhp",
    slug: "medical-plan-bcbs-prime-hdhp",
    title: "Medical Plan - BCBS Prime HDHP",
    description: "High deductible health plan with HSA opportunity.",
    fullContent: "The BCBS Prime HDHP provides comprehensive coverage with lower premiums and the opportunity to save with a Health Savings Account.",
    image: "/api/placeholder?w=400&h=300&text=Medical+HDHP",
  },
  {
    id: "medical-plan-bcbs-alternative-hdhp",
    slug: "medical-plan-bcbs-alternative-hdhp",
    title: "Medical Plan - BCBS Alternative HDHP",
    description: "Alternative high deductible health plan option.",
    fullContent: "An alternative HDHP option for those seeking a different balance of premiums and deductibles.",
    image: "/api/placeholder?w=400&h=300&text=Medical+Alternative",
  },
  {
    id: "dental-benefits",
    slug: "dental-benefits",
    title: "Dental Benefits",
    description: "Comprehensive dental coverage for you and your family.",
    fullContent: "RS&H offers comprehensive dental benefits including preventive, basic, and major services with competitive cost sharing.",
    image: "/api/placeholder?w=400&h=300&text=Dental+Benefits",
  },
  {
    id: "vision-benefits",
    slug: "vision-benefits",
    title: "Vision Benefits",
    description: "Eye care coverage including exams and glasses.",
    fullContent: "Vision benefits cover eye exams, eyeglasses, contact lenses, and other vision care services.",
    image: "/api/placeholder?w=400&h=300&text=Vision+Benefits",
  },
  {
    id: "employee-assistance-program",
    slug: "employee-assistance-program",
    title: "Employee Assistance Program",
    description: "Confidential support for work and life challenges.",
    fullContent: "Our EAP provides free, confidential counseling and support services for employees and their families.",
    image: "/api/placeholder?w=400&h=300&text=EAP",
  },
  {
    id: "fsa-and-hsa",
    slug: "fsa-and-hsa",
    title: "FSA and HSA",
    description: "Tax-advantaged accounts for healthcare expenses.",
    fullContent: "Flexible Spending Accounts and Health Savings Accounts allow you to save pre-tax dollars for qualified healthcare expenses.",
    image: "/api/placeholder?w=400&h=300&text=FSA+HSA",
  },
  {
    id: "survivor-benefits",
    slug: "survivor-benefits",
    title: "Survivor Benefits",
    description: "Life insurance and survivor protection.",
    fullContent: "Life insurance and other survivor benefits provide financial protection for your loved ones.",
    image: "/api/placeholder?w=400&h=300&text=Survivor+Benefits",
  },
  {
    id: "supplemental-health",
    slug: "supplemental-health",
    title: "Supplemental Health",
    description: "Additional voluntary health coverage options.",
    fullContent: "Supplement your primary coverage with voluntary accident, critical illness, and hospital indemnity insurance.",
    image: "/api/placeholder?w=400&h=300&text=Supplemental+Health",
  },
  {
    id: "income-protection",
    slug: "income-protection",
    title: "Income Protection",
    description: "Disability and income replacement benefits.",
    fullContent: "Short-term and long-term disability benefits protect your income during periods when you cannot work.",
    image: "/api/placeholder?w=400&h=300&text=Income+Protection",
  },
  {
    id: "financial-wellbeing",
    slug: "financial-wellbeing",
    title: "Financial Wellbeing",
    description: "Financial planning and wellness resources.",
    fullContent: "Access tools, resources, and guidance to help you achieve your financial goals and plan for the future.",
    image: "/api/placeholder?w=400&h=300&text=Financial+Wellbeing",
  },
  {
    id: "paid-time-off-and-other-benefits",
    slug: "paid-time-off-and-other-benefits",
    title: "Paid Time Off & Other Benefits",
    description: "Time off policies and additional benefits.",
    fullContent: "Information about vacation, sick leave, holidays, and other time-off policies.",
    image: "/api/placeholder?w=400&h=300&text=PTO+Benefits",
  },
  {
    id: "additional-voluntary-benefits",
    slug: "additional-voluntary-benefits",
    title: "Additional Voluntary Benefits",
    description: "Optional benefits you can choose to add.",
    fullContent: "Explore additional voluntary benefits available to enhance your total rewards package.",
    image: "/api/placeholder?w=400&h=300&text=Voluntary+Benefits",
  },
];

export const DOCUMENTS = [
  { id: 1, title: "2026 Benefits Summary", type: "PDF", size: "2.4 MB" },
  { id: 2, title: "Medical Plan Details", type: "PDF", size: "1.8 MB" },
  { id: 3, title: "Dental Plan Guide", type: "PDF", size: "1.2 MB" },
  { id: 4, title: "Vision Plan Summary", type: "PDF", size: "0.9 MB" },
  { id: 5, title: "FSA/HSA Guide", type: "PDF", size: "1.5 MB" },
];

export const QUICK_LINKS = [
  { label: "Benefits Guide", href: "/" },
  { label: "Enrollment", href: "/enrollment-checklist" },
  { label: "Support", href: "#" },
];

export const CONTACT_INFO: ContactInfo[] = [
  { label: "Benefits Phone", value: "(555) 123-4567" },
  { label: "Benefits Email", value: "benefits@rshealth.com", href: "mailto:benefits@rshealth.com" },
  { label: "HR Portal", value: "portal.rshealth.com", href: "#" },
];

export const OPEN_ENROLLMENT_INFO = {
  title: "Welcome to Open Enrollment",
  description: "Review and update your benefits selections",
  daysLeft: 12,
  startDate: "January 1, 2025",
  endDate: "January 31, 2025",
};

export function getBenefitChapterBySlug(slug: string): BenefitChapter | undefined {
  return BENEFIT_CHAPTERS.find((chapter) => chapter.slug === slug);
}
