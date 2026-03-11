/**
 * Custom Chapter Template — Converts user-defined CustomTemplateDefinition
 * into a JSON schema fragment for LlamaExtract.
 *
 * Property key convention: `custom_{templateId}_chapter`
 * This keeps custom templates separate from hardcoded ones in the raw extraction output.
 */

import type { CustomTemplateDefinition, CustomTemplateField } from '../types'

export function customTemplatePropertyKey(templateId: string): string {
  const safe = templateId.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
  return `custom_${safe}_chapter`
}

function buildFieldSchema(field: CustomTemplateField): Record<string, unknown> {
  switch (field.fieldType) {
    case 'text':
      return {
        type: 'string',
        description: field.fieldDescription,
      }

    case 'paragraphs':
      return {
        type: 'array',
        items: { type: 'string' },
        description: field.fieldDescription,
      }

    case 'table': {
      const colDescriptions = (field.tableColumns || [])
        .map((col, i) => `Column ${i + 1}: "${col}"`)
        .join(', ')

      return {
        type: 'object',
        description: `${field.fieldDescription} Table columns: ${colDescriptions || 'auto-detect from PDF'}.`,
        properties: {
          tableTitle: {
            type: 'string',
            description: 'Title of the table as it appears in the PDF.',
          },
          rows: {
            type: 'array',
            description: `Extract every row. Each row has a label (first column) and cells array matching columns: ${(field.tableColumns || []).join(', ') || 'auto-detect'}.`,
            items: {
              type: 'object',
              properties: {
                label: { type: 'string', description: 'Row label (first column value).' },
                cells: {
                  type: 'array',
                  items: { type: 'string' },
                  description: `Cell values in order: ${(field.tableColumns || []).slice(1).join(', ') || 'remaining columns'}. Use "—" for empty cells.`,
                },
              },
              required: ['label', 'cells'],
            },
          },
        },
      }
    }

    default:
      return { type: 'string', description: field.fieldDescription }
  }
}

/**
 * Build a JSON schema fragment for a single custom template.
 * Returns a Record with one key (the property key) mapped to its schema.
 */
export function buildCustomTemplateSchema(
  template: CustomTemplateDefinition
): Record<string, unknown> {
  const propKey = customTemplatePropertyKey(template.templateId)
  const fieldProperties: Record<string, unknown> = {}

  for (const field of template.fields) {
    const safeName = field.fieldName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    fieldProperties[safeName] = buildFieldSchema(field)
  }

  return {
    [propKey]: {
      type: 'object',
      description: `${template.description} Extract all information for the "${template.displayName}" chapter.`,
      properties: fieldProperties,
    },
  }
}
