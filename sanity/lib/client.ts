import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId: 'ow03d9eg',
  dataset: 'production',
  apiVersion: '2026-02-11',
  useCdn: false, // Set to false if statically generating pages, using ISR or tag-based revalidation
})
