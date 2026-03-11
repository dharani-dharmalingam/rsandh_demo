/**
 * Financial Wellbeing Chapter Template.
 *
 * Extracts:
 * 1. 401(k) Intro
 * 2. Fidelity Transition (2026)
 * 3. Eligibility
 * 4. Enrollment & Contributions
 * 5. Auto-enrollment
 * 6. Annual Contribution Limits Table
 * 7. Company Matching (Cash/Stock)
 * 8. Vesting Schedule + Table
 * 9. Account Types (Pre-tax/Roth)
 * 10. Beneficiaries
 * 11. Loans & Employee Ownership
 */

import type { ChapterTemplate } from './types'

export const FINANCIAL_WELLBEING_TEMPLATE: ChapterTemplate = {
    id: 'financial-wellbeing',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            financial_wellbeing_chapter: {
                type: 'object',
                description: 'Extract all content from the Financial Wellbeing / 401(k) / Retirement chapter.',
                properties: {
                    // ── General Intro ──
                    introParagraph: { type: 'string', description: 'Brief intro to the 401(k) plan.' },

                    // ── Fidelity Transition ──
                    fidelityTransitionTitle: { type: 'string', description: 'e.g., "Transitioning to Fidelity for 401(k) starting in 2026".' },
                    fidelityTransitionBullets: {
                        type: 'array',
                        description: 'Bullet points about the transition.',
                        items: { type: 'string' }
                    },

                    // ── Eligibility ──
                    eligibilityBullets: {
                        type: 'array',
                        description: 'Bullet points about 401(k) eligibility.',
                        items: { type: 'string' }
                    },

                    // ── Enrollment & Contributions ──
                    enrollmentIntro: { type: 'string', description: 'e.g., "Eligible employees can start contributing to the 401(k) plan on day one".' },
                    autoEnrollmentBullets: {
                        type: 'array',
                        description: 'Bullet points about auto-enrollment (6%, default funds, opt-out period).',
                        items: { type: 'string' }
                    },

                    // ── Contribution Limits Table ──
                    contributionLimitsTable: {
                        type: 'array',
                        description: 'The "Annual Contribution Limits" table.',
                        items: {
                            type: 'object',
                            properties: {
                                type: { type: 'string', description: 'e.g., "Standard Contribution", "Catchup Contribution".' },
                                age: { type: 'string', description: 'e.g., "Under 50", "50-59".' },
                                maxContribution: { type: 'string', description: 'e.g., "$23,500".' },
                                eligibleForMatch: { type: 'string', description: 'e.g., "Yes", "No".' },
                                info: { type: 'string', description: 'Additional info column content.' }
                            }
                        }
                    },

                    // ── Company Matching ──
                    companyMatchingTitle: { type: 'string', description: 'Title for matching section.' },
                    companyMatchingBullets: {
                        type: 'array',
                        description: 'Bullet points explaining the 50% match up to 6%, and the 2/3 cash vs 1/3 stock split.',
                        items: { type: 'string' }
                    },
                    matchingExample: { type: 'string', description: 'Full text of the match example if present.' },

                    // ── Vesting Schedule ──
                    vestingIntroBullets: {
                        type: 'array',
                        description: 'Bullet points explaining vesting (ownership, 5 years for full vesting).',
                        items: { type: 'string' }
                    },
                    vestingScheduleTable: {
                        type: 'array',
                        description: 'The "Years of Service" vs "Vesting Percentage" table.',
                        items: {
                            type: 'object',
                            properties: {
                                years: { type: 'string', description: 'e.g., "Less than 1 year", "1 but less than 2 years".' },
                                percentage: { type: 'string', description: 'e.g., "0%", "20%".' }
                            }
                        }
                    },

                    // ── Account Types ──
                    accountTypesIntro: { type: 'string', description: 'e.g., "Different types of 401(k) accounts".' },
                    preTaxAccountBullets: {
                        type: 'array',
                        description: 'Bullet points for Pre-tax 401(k).',
                        items: { type: 'string' }
                    },
                    rothAccountBullets: {
                        type: 'array',
                        description: 'Bullet points for Roth 401(k).',
                        items: { type: 'string' }
                    },

                    // ── Beneficiaries ──
                    beneficiariesBullets: {
                        type: 'array',
                        description: 'Bullet points explaining how to manage beneficiaries (netbenefits.com).',
                        items: { type: 'string' }
                    },

                    // ── Additional Topics ──
                    loansInfo: { type: 'string', description: 'Information about 401(k) loans if present.' },
                    employeeOwnershipInfo: { type: 'string', description: 'Information about Employee Stock Ownership (ESOP) or stock opportunities.' },
                    investmentOpportunities: { type: 'string', description: 'General opportunities for investment info.' },

                    additionalDetails: {
                        type: 'array',
                        description: 'Any other topics or paragraphs found in the chapter.',
                        items: { type: 'string' }
                    }
                },
            },
        }
    },
}
