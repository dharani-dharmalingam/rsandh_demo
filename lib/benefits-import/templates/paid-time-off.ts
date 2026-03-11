/**
 * Paid Time Off Chapter Template.
 *
 * Extracts (in order):
 * 1. Holidays (Intro + List of Observed)
 * 2. Floating Holiday explanation
 * 3. Religious Holidays explanation
 * 4. Time Away (Intro + Accrual Table)
 * 5. Accrual Logic explanation
 * 6. Additional Leave (PL, LB, PPL, Bereavement, Jury Duty)
 */

import type { ChapterTemplate } from './types'

export const PAID_TIME_OFF_TEMPLATE: ChapterTemplate = {
    id: 'paid-time-off',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            paid_time_off_chapter: {
                type: 'object',
                description: 'Extract all content from the Paid Time Off and Other Benefits chapter.',
                properties: {
                    // ── Holidays ──
                    holidayIntro: { type: 'string', description: 'Intro paragraph for holidays. e.g., "RS&H observes the following holidays..."' },
                    observedHolidays: {
                        type: 'array',
                        description: 'List of observed holidays.',
                        items: { type: 'string' }
                    },
                    floatingHolidayDescription: { type: 'string', description: 'Explanation about the floating holiday.' },
                    religiousHolidaysDescription: { type: 'string', description: 'Explanation about religious holidays.' },

                    // ── Time Away (Vacation) ──
                    vacationIntro: { type: 'string', description: 'Intro for vacation allowance.' },
                    vacationAccrualTable: {
                        type: 'array',
                        description: 'The vacation entitlement table by years of service.',
                        items: {
                            type: 'object',
                            properties: {
                                yearsOfService: { type: 'string', description: 'e.g., "1 but less than 3 years", "New Hire Accrual".' },
                                entitlement: { type: 'string', description: 'e.g., "10 days", "3.07 hours per payroll period".' }
                            }
                        }
                    },
                    accrualExplanationBullets: {
                        type: 'array',
                        description: 'Bullet points explaining accrual logic (credited at beginning of year, etc.).',
                        items: { type: 'string' }
                    },

                    // ── Additional Leave ──
                    personalLeaveDescription: { type: 'string', description: 'Explanation of Personal Leave (PL).' },
                    leaveBankDescription: { type: 'string', description: 'Explanation of Leave Bank (LB), including the 240 hour limit.' },
                    paidParentalLeaveDescription: { type: 'string', description: 'Explanation of Paid Parental Leave (PPL).' },
                    paidParentalLeaveSpecifics: {
                        type: 'array',
                        description: 'Specific bullet points for PPL (up to 3 weeks logic).',
                        items: { type: 'string' }
                    },
                    bereavementLeaveDescription: { type: 'string', description: 'Explanation of Bereavement Leave.' },
                    juryDutyDescription: { type: 'string', description: 'Explanation of Jury Duty leave.' },

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
