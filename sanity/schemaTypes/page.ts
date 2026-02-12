import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' }
    }),
    defineField({
      name: 'client',
      type: 'reference',
      to: [{ type: 'client' }]
    }),
    defineField({ name: 'content', type: 'array', of: [{ type: 'block' }] })
  ]
})
