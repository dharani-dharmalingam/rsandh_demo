import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'openEnrollment',
  title: 'Open Enrollment Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'startDate', title: 'Start Date', type: 'datetime' }),
    defineField({ name: 'endDate', title: 'End Date', type: 'datetime' }),
    defineField({ name: 'enrollmentLink', title: 'Enrollment Link', type: 'url' }),
    defineField({ name: 'benefitsGuide', title: 'Benefits Guide PDF', type: 'file' }),
    defineField({ name: 'videoUrl', title: 'Hero Video URL', type: 'url', description: 'Enter a YouTube or Vimeo embed link' }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
      validation: (Rule) => Rule.required(),
    }),
  ]
})
