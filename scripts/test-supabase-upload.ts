import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  dotenv.config()
}

async function testUpload() {
  // Dynamically import after env is loaded
  const { uploadPdf, getPublicUrl, isSupabaseConfigured } = await import('../lib/supabase/storage')

  console.log('--- Supabase Upload Test ---')
  console.log('Configured:', isSupabaseConfigured())
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (!isSupabaseConfigured()) {
    console.error('Supabase is NOT configured. Check .env.local')
    process.exit(1)
  }

  const slug = 'test-client-' + Date.now()
  const dummyBuffer = Buffer.from('This is a dummy PDF content for testing Supabase upload.')

  try {
    console.log(`Attempting to upload dummy PDF for slug: ${slug}...`)
    const storagePath = await uploadPdf(slug, dummyBuffer)
    console.log('Upload successful!')
    console.log('Storage Path:', storagePath)
    
    const publicUrl = getPublicUrl(storagePath)
    console.log('Public URL:', publicUrl)
    console.log('\n--- Test Passed ---')
    console.log('You can visit the URL above to verify the file exists in your bucket.')
  } catch (err) {
    console.error('Upload failed:', err)
  }
}

testUpload()
