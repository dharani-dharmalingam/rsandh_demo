import { definePlugin } from 'sanity'
import { BenefitsImportTool } from './index'

export const benefitsImportTool = definePlugin(() => ({
  name: 'benefits-import-tool',
  tools: [
    {
      name: 'benefits-import',
      title: 'Import Benefits Guide',
      component: BenefitsImportTool,
    },
  ],
}))
