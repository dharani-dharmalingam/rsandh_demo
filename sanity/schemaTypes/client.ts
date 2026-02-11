import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string' }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'logoLeft', type: 'image' }),
    defineField({ name: 'logoRight', type: 'image' }),
    defineField({ name: 'themeColor', type: 'string' })
  ]
})
