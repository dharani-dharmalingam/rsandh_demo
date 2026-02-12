import { defineType, defineField } from 'sanity'

export default defineType({
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    fields: [
        defineField({
            name: 'logoText',
            title: 'Logo Text',
            type: 'string',
        }),
        defineField({
            name: 'footerAbout',
            title: 'Footer About Text',
            type: 'text',
        }),
        defineField({
            name: 'quickLinks',
            title: 'Quick Links',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'label', type: 'string', title: 'Label' },
                        { name: 'href', type: 'string', title: 'Internal Path or URL' }
                    ]
                }
            ]
        }),
        defineField({
            name: 'contactInfo',
            title: 'Contact Information',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'label', type: 'string', title: 'Label' },
                        { name: 'value', type: 'string', title: 'Value' },
                        { name: 'href', type: 'string', title: 'Link (optional)' }
                    ]
                }
            ]
        }),
        defineField({
            name: 'copyrightText',
            title: 'Copyright Text',
            type: 'string',
        })
    ]
})
