import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'openEnrollment',
  title: 'Open Enrollment Settings',
  type: 'document',
  fields: [
    defineField({ name: 'startDate', type: 'datetime' }),
    defineField({ name: 'endDate', type: 'datetime' }),
    defineField({ name: 'enrollmentLink', type: 'url' }),
    defineField({ name: 'benefitsGuide', type: 'file' })
  ]
})
