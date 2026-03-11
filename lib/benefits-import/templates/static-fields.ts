/**
 * Static Fields Template — Non-chapter schema properties.
 *
 * Generates schema properties for: companyName, themeColor, landingPage,
 * retirementPlanning, enrollmentChecklist, benefitChanges, contactInfo,
 * quickLinks, quickAccess.
 */

import type { ChapterTemplate } from './types'

export const STATIC_FIELDS_TEMPLATE: ChapterTemplate = {
    id: 'static-fields',

    buildSchemaProperties(): Record<string, unknown> {
        return {
            companyName: {
                type: 'string',
                description: 'The name of the company.',
            },
            themeColor: {
                type: 'string',
                description: 'Primary brand color in hex format.',
            },
            landingPage: {
                type: 'object',
                properties: {
                    heroTitle: { type: 'string', description: 'Main greeting on the homepage.' },
                    heroSubtitle: { type: 'string', description: 'Subheader text.' },
                    explainerVideo: {
                        type: 'object',
                        properties: {
                            title: { type: 'string' },
                            description: { type: 'string' },
                            url: { type: 'string' },
                        },
                    },
                },
            },
            retirementPlanning: {
                type: 'object',
                description: 'Details about retirement planning if mentioned.',
                properties: {
                    heroTitle: { type: 'string' },
                    heroDescription: { type: 'string' },
                    features: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                icon: { type: 'string' },
                                title: { type: 'string' },
                                description: { type: 'string' },
                            },
                        },
                    },
                    planningTitle: { type: 'string' },
                    sections: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                content: { type: 'string' },
                            },
                        },
                    },
                    ctaButtonText: { type: 'string' },
                    heroVideoUrl: { type: 'string' },
                },
            },
            enrollmentChecklist: {
                type: 'array',
                description: 'Step-by-step enrollment checklist items.',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                    },
                    required: ['title', 'description'],
                },
            },
            benefitChanges: {
                type: 'array',
                description: 'Changes or updates for the current plan year.',
                items: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', description: '"new" or "update".' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                    },
                    required: ['type', 'title', 'description'],
                },
            },
            contactInfo: {
                type: 'array',
                description: 'Contact information found in the document.',
                items: {
                    type: 'object',
                    properties: {
                        label: { type: 'string' },
                        value: { type: 'string' },
                        href: { type: 'string' },
                        groupNumber: { type: 'string' },
                    },
                    required: ['label', 'value'],
                },
            },
            quickLinks: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        label: { type: 'string' },
                        href: { type: 'string' },
                    },
                    required: ['label', 'href'],
                },
            },
            quickAccess: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        href: { type: 'string' },
                        iconName: { type: 'string' },
                    },
                    required: ['title', 'description', 'href'],
                },
            },
        }
    },
}
