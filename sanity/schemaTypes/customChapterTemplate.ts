import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'customChapterTemplate',
  title: 'Custom Chapter Template',
  type: 'document',
  fields: [
    defineField({
      name: 'templateId',
      title: 'Template ID',
      type: 'slug',
      description: 'Unique key for this template (e.g., "pet-insurance").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'displayName',
      title: 'Display Name',
      type: 'string',
      description: 'Human-readable name (e.g., "Pet Insurance").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Extraction Description',
      type: 'text',
      rows: 3,
      description: 'LLM instruction describing what to extract from this chapter type.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Determines the icon and grouping for this chapter.',
      options: {
        list: [
          { title: 'Eligibility', value: 'eligibility' },
          { title: 'Medical', value: 'medical' },
          { title: 'Dental', value: 'dental' },
          { title: 'Vision', value: 'vision' },
          { title: 'FSA / HSA', value: 'fsa-hsa' },
          { title: 'EAP', value: 'eap' },
          { title: 'Supplemental', value: 'supplemental' },
          { title: 'Disability', value: 'disability' },
          { title: 'Life Insurance', value: 'life-insurance' },
          { title: 'Retirement', value: 'retirement' },
          { title: 'Pet Insurance', value: 'pet-insurance' },
          { title: 'College Savings', value: 'college-savings' },
          { title: 'Wellness', value: 'wellness' },
          { title: 'Paid Time Off', value: 'paid-time-off' },
          { title: 'Voluntary Benefits', value: 'voluntary-benefits' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'fields',
      title: 'Extraction Fields',
      type: 'array',
      description: 'Define the fields the LLM should extract for this chapter.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'fieldName',
              title: 'Field Name',
              type: 'string',
              description: 'Safe key name (e.g., "provider_name", "coverage_details").',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'fieldType',
              title: 'Field Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Text (single value)', value: 'text' },
                  { title: 'Bullet List (array of strings)', value: 'paragraphs' },
                  { title: 'Table (rows + columns)', value: 'table' },
                ],
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'fieldDescription',
              title: 'Extraction Prompt',
              type: 'text',
              rows: 2,
              description: 'Instruction for the LLM on what to extract for this field.',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'tableColumns',
              title: 'Table Columns',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Column headers for table fields. Only used when Field Type is "Table".',
              hidden: ({ parent }) => parent?.fieldType !== 'table',
            }),
          ],
          preview: {
            select: { title: 'fieldName', subtitle: 'fieldType' },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'displayName', subtitle: 'category' },
  },
})
