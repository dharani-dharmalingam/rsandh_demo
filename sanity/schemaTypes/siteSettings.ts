import { defineType, defineField } from 'sanity'

export default defineType({
    name: 'siteSettings',
    title: 'Site Settings',
    type: 'document',
    fields: [
        defineField({
            name: 'clientName',
            title: 'Client Name',
            type: 'string',
            description: 'Full name of the client (e.g. RS&H, ABC Corp)',
        }),
        defineField({
            name: 'shortName',
            title: 'Short Name / Initials',
            type: 'string',
            description: 'Shortened name or initials for logos (e.g. RS, ABC)',
        }),
        defineField({
            name: 'clientLogo',
            title: 'Client Logo',
            type: 'image',
            options: {
                hotspot: true,
            }
        }),
        defineField({
            name: 'client',
            title: 'Client',
            type: 'reference',
            to: [{ type: 'client' }],
            validation: (Rule) => Rule.required(),
        }),
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
