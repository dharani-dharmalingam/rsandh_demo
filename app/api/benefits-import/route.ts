/**
 * Phase 1 -- PDF upload -> LlamaExtract plan detection -> return for review.
 * POST with multipart/form-data: file (PDF), clientSlug.
 *
 * PDFs are stored locally in content/uploads/ instead of Sanity.
 */

import { NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { detectPlans } from '@/lib/benefits-import/extract'

export const maxDuration = 900

const UPLOADS_DIR = path.join(process.cwd(), 'content', 'uploads')

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  try {
    const apiKey = process.env.LLAMA_CLOUD_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'LLAMA_CLOUD_API_KEY is not set in environment variables.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileAssetId = formData.get('fileAssetId') as string | null
    const clientSlug = (formData.get('clientSlug') as string)?.trim()
    const logoFile = formData.get('logo') as File | null

    if ((!file && !fileAssetId) || !clientSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: file (or fileAssetId) and clientSlug' },
        { status: 400 }
      )
    }

    ensureUploadsDir()

    let buffer: Buffer
    let savedFileId = fileAssetId || undefined

    if (file) {
      buffer = Buffer.from(await file.arrayBuffer())

      if (!savedFileId) {
        const filename = `${clientSlug}-benefits-guide.pdf`
        const filePath = path.join(UPLOADS_DIR, filename)
        fs.writeFileSync(filePath, buffer)
        savedFileId = filename
        console.log(`[benefits-import] PDF saved locally: ${filePath}`)
      }
    } else if (fileAssetId) {
      const filePath = path.join(UPLOADS_DIR, fileAssetId)
      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: `File not found: ${fileAssetId}` },
          { status: 404 }
        )
      }
      buffer = fs.readFileSync(filePath)
    } else {
      throw new Error('No PDF content provided')
    }

    let logoFileId: string | undefined
    if (logoFile) {
      const logoFilename = `${clientSlug}-logo${path.extname(logoFile.name || '.png')}`
      const logoPath = path.join(UPLOADS_DIR, logoFilename)
      const logoBuffer = Buffer.from(await logoFile.arrayBuffer())
      fs.writeFileSync(logoPath, logoBuffer)
      logoFileId = logoFilename
    }

    const detectionStart = Date.now()
    console.log(`[benefits-import] Phase 1: Calling detectPlans for client: ${clientSlug}...`)
    const phase1Result = await detectPlans(buffer, { apiKey })

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1)
    const detectionDuration = ((Date.now() - detectionStart) / 1000).toFixed(1)
    console.log(`[benefits-import] Phase 1 detection took ${detectionDuration}s. Total time: ${totalDuration}s.`)

    return NextResponse.json({
      success: true,
      phase: 1,
      ...phase1Result,
      fileAssetId: savedFileId,
      logoAssetId: logoFileId,
      clientSlug,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Phase 1 detection failed'
    console.error('[benefits-import]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
