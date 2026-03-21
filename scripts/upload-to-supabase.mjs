/**
 * One-time script: upload local PDF and logo to Supabase Storage under a given slug.
 * Usage: node scripts/upload-to-supabase.mjs <slug> <pdf-path> <logo-path>
 * Example: node scripts/upload-to-supabase.mjs rsandh content/uploads/rs-h-benefits-guide.pdf content/uploads/rs-h-logo.png
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const BUCKET = 'employer-assets'
const slug = process.argv[2]
const pdfPath = process.argv[3]
const logoPath = process.argv[4]

if (!slug || !pdfPath || !logoPath) {
  console.error('Usage: node scripts/upload-to-supabase.mjs <slug> <pdf-path> <logo-path>')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function upload(localPath, storagePath, contentType) {
  const buffer = readFileSync(localPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true })
  if (error) throw new Error(`Upload failed for ${storagePath}: ${error.message}`)
  console.log(`✓ Uploaded ${localPath} → ${BUCKET}/${storagePath}`)
}

try {
  await upload(pdfPath, `${slug}/benefits-guide.pdf`, 'application/pdf')
  await upload(logoPath, `${slug}/logo.png`, 'image/png')
  console.log(`\nDone. Files available at:\n  ${slug}/benefits-guide.pdf\n  ${slug}/logo.png`)
} catch (err) {
  console.error('Error:', err.message)
  process.exit(1)
}
