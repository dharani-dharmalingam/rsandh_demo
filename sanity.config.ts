'use client'

/**
 * This configuration is used to for the Sanity Studio that's mounted on the `\app\sanity\[[...tool]]\page.tsx` route
 */

import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { benefitsImportTool } from './sanity/plugins/benefits-import-tool/plugin'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId, siteUrl } from './sanity/env'
import { schemaTypes } from './sanity/schemaTypes'
import { structure } from './sanity/structure'

export default defineConfig({
  basePath: '/sanity',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        origin: siteUrl,
        previewMode: {
          enable: '/api/draft-mode/enable',
        },
      },
      // Allow the deployed Vercel origin and localhost
      allowOrigins: ['https://dbh-demosite.vercel.app', 'http://localhost:3000'],
      resolve: {
        mainDocuments: [
          {
            route: '/:clientSlug',
            filter: '_type == "client" && slug.current == $clientSlug',
          },
          {
            route: '/:clientSlug/benefits',
            filter: '_type == "benefitsPage" && client->slug.current == $clientSlug',
          },
        ],
      },
    }),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion }),
    benefitsImportTool(),
  ],
})
