import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'benefitChapter',
  title: 'Benefit Chapter',
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
    defineField({ name: 'heroImage', type: 'image' }),
    defineField({ name: 'shortDescription', type: 'text' }),
    defineField({ name: 'content', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'order', type: 'number' })
  ]
})
