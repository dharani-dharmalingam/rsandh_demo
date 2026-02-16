import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  stega: {
    studioUrl: process.env.NODE_ENV === 'production'
      ? 'https://rsandh-hub.sanity.studio'
      : 'http://localhost:3000/sanity',
  },
})
