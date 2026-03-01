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
            weak: true,
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
            name: 'quickAccess',
            title: 'Quick Access Cards',
            type: 'array',
            description: 'Top-level cards below the retirement section (e.g. UKG, Support, Document Hub)',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'title', type: 'string', title: 'Title' },
                        { name: 'description', type: 'string', title: 'Description' },
                        { name: 'href', type: 'string', title: 'Link URL' },
                        { name: 'iconName', type: 'string', title: 'Icon Name', description: 'lucide-react icon name (building, message-square, mail, file-text)' }
                    ]
                }
            ]
        }),
        defineField({
            name: 'contactInfo',
            title: 'Footer Contact List',
            type: 'array',
            description: 'Detailed contacts listed in the footer column',
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
            name: 'footerContactTitle',
            title: 'Footer Contact Title',
            type: 'string',
            initialValue: 'Contact',
        }),
        defineField({
            name: 'footerContactDescription',
            title: 'Footer Contact Description',
            type: 'text',
            initialValue: 'Have questions? Reach out to our support team.',
        }),
        defineField({
            name: 'copyrightText',
            title: 'Copyright Text',
            type: 'string',
        })
    ]
})
