import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'documentHub',
  title: 'Document Hub',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'file', type: 'file' }),
    defineField({
      name: 'client',
      type: 'reference',
      to: [{ type: 'client' }]
    })
  ]
})
