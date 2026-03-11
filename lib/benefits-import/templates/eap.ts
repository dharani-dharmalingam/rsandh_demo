/**
 * Employee Assistance Program (EAP) Chapter Template.
 *
 * Extracts:
 * - Provider info and contact
 * - Free visits info
 * - Services list
 * - Description/overview paragraphs
 */

import type { ChapterTemplate } from './types'

export const EAP_CHAPTER_TEMPLATE: ChapterTemplate = {
    id: 'eap',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            eap_chapter: {
                type: 'object',
                description: 'Extract all content from the Employee Assistance Program (EAP) chapter.',
                properties: {
                    providerName: {
                        type: 'string',
                        description: 'EAP provider name. e.g., "Health Advocate".',
                    },
                    providerPhone: {
                        type: 'string',
                        description: 'EAP provider phone number. e.g., "1.866.799.2728".',
                    },
                    description: {
                        type: 'string',
                        description: 'Overview description of the EAP program. e.g., "RS&H offers all associates and their families access to a confidential EAP tailored to their needs."',
                    },
                    freeVisits: {
                        type: 'string',
                        description: 'Number of free visits and details. e.g., "Six free visits (virtual or in-person) with licensed professionals per incident."',
                    },
                    availabilityNote: {
                        type: 'string',
                        description: 'Availability details. e.g., "Services are available 24/7 via telephone, face-to-face, or web-based assistance."',
                    },
                    services: {
                        type: 'array',
                        description: 'List of EAP services. e.g., "Adoption", "Alcohol/substance abuse", "Anxiety", "Cancer support", "Child and elder care", "Financial planning", "Grieving", "Legal services".',
                        items: { type: 'string' },
                    },
                },
            },
        }
    },
}
