/**
 * Remote MCP Server — Web Standard Streamable HTTP transport.
 * Compatible with Next.js App Router + Vercel (Hobby & Pro).
 *
 * Claude.ai → Settings → Integrations → Add:
 *   URL:  https://dbh-demosite.vercel.app/api/mcp
 *   Header: Authorization: Bearer <MCP_API_KEY>
 *
 * 6 tools for the full microsite pipeline:
 *   1. upload_pdf          — base64 PDF + logo → Supabase Storage
 *   2. parse_pdf           — submit PDF to LlamaParse, returns job_id immediately
 *   3. check_parse_status  — single status check; call every 5s until "done"
 *   4. get_markdown        — fetch full markdown from DB for Claude to read
 *   5. save_extraction     — save Claude's ExtractedBenefitsData JSON to DB
 *   6. publish_microsite   — transform + Git commit → Vercel deploys
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dbh-demosite.vercel.app'

async function pipelineFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const json = await res.json()
  return { ok: res.ok, data: json }
}

function buildServer(): McpServer {
  const server = new McpServer({ name: 'microsite-pipeline', version: '1.0.0' })

  // ── Tool 1: upload_pdf ──────────────────────────────────────────────────────
  server.tool(
    'upload_pdf',
    'Upload a PDF benefits guide and/or company logo (base64-encoded) to storage. Always call this first before parsing.',
    {
      slug: z.string().describe('URL-safe company identifier, e.g. "acme-corp"'),
      pdf_base64: z.string().optional().describe('Base64-encoded PDF file content'),
      logo_base64: z.string().optional().describe('Base64-encoded logo image content'),
      logo_mime: z.string().optional().describe('Logo MIME type: "image/png" or "image/jpeg"'),
    },
    async ({ slug, pdf_base64, logo_base64, logo_mime }) => {
      const { ok, data } = await pipelineFetch('/api/pipeline/upload', {
        method: 'POST',
        body: JSON.stringify({ slug, pdf_base64, logo_base64, logo_mime }),
      })
      if (!ok) return { content: [{ type: 'text' as const, text: `Upload failed: ${data.error}` }] }
      return {
        content: [{
          type: 'text' as const,
          text: `✓ Files uploaded for "${slug}"\n${data.pdf ? `PDF: ${data.pdf}` : ''}${data.logo ? `\nLogo: ${data.logo}` : ''}\n\nNext: call parse_pdf("${slug}")`,
        }],
      }
    }
  )

  // ── Tool 2: parse_pdf ───────────────────────────────────────────────────────
  server.tool(
    'parse_pdf',
    'Submit the uploaded PDF to LlamaParse for markdown conversion. Returns job_id immediately — then poll check_parse_status.',
    {
      slug: z.string().describe('Company slug matching the uploaded PDF'),
    },
    async ({ slug }) => {
      const { ok, data } = await pipelineFetch('/api/pipeline/parse', {
        method: 'POST',
        body: JSON.stringify({ slug }),
      })
      if (!ok) return { content: [{ type: 'text' as const, text: `Parse failed: ${data.error}` }] }
      return {
        content: [{
          type: 'text' as const,
          text: `✓ LlamaParse job started for "${slug}"\nJob ID: ${data.jobId}\nStatus: processing\n\nNow call check_parse_status("${slug}") every 5 seconds until status is "done".`,
        }],
      }
    }
  )

  // ── Tool 3: check_parse_status ──────────────────────────────────────────────
  server.tool(
    'check_parse_status',
    'Check if LlamaParse has finished converting the PDF. Returns "processing" or "done" with a preview. Call every 5 seconds until done.',
    {
      slug: z.string().describe('Company slug to check'),
    },
    async ({ slug }) => {
      const { ok, data } = await pipelineFetch(`/api/pipeline/parse/status?slug=${encodeURIComponent(slug)}`)
      if (!ok) return { content: [{ type: 'text' as const, text: `Status check failed: ${data.error}` }] }
      if (data.status === 'processing') {
        return { content: [{ type: 'text' as const, text: `⏳ Still processing for "${slug}"... Call check_parse_status again in 5 seconds.` }] }
      }
      return {
        content: [{
          type: 'text' as const,
          text: `✓ Parsing complete for "${slug}"\nWords: ${data.wordCount} | Sections: ${data.sectionCount}\n\nPreview:\n${data.preview}\n\nNext: call get_markdown("${slug}") to load the full content for extraction.`,
        }],
      }
    }
  )

  // ── Tool 4: get_markdown ────────────────────────────────────────────────────
  server.tool(
    'get_markdown',
    'Fetch the full parsed markdown from the database. Read it carefully — you will extract all benefit plans, premiums, contacts, and eligibility details from this content.',
    {
      slug: z.string().describe('Company slug'),
    },
    async ({ slug }) => {
      const { ok, data } = await pipelineFetch(`/api/pipeline/parsed?slug=${encodeURIComponent(slug)}`)
      if (!ok) return { content: [{ type: 'text' as const, text: `Fetch failed: ${data.error}` }] }
      return {
        content: [{
          type: 'text' as const,
          text: `Markdown for "${slug}" (${data.markdown?.length ?? 0} chars):\n\n${data.markdown}`,
        }],
      }
    }
  )

  // ── Tool 5: save_extraction ─────────────────────────────────────────────────
  server.tool(
    'save_extraction',
    'Save your structured extraction (ExtractedBenefitsData) to the database. Must include companyName and at least one chapter.',
    {
      slug: z.string().describe('Company slug'),
      extracted_data: z.record(z.any()).describe('Full ExtractedBenefitsData with companyName, chapters[], detectedPlans, contactInfo, etc.'),
    },
    async ({ slug, extracted_data }) => {
      const { ok, data } = await pipelineFetch('/api/pipeline/parsed', {
        method: 'POST',
        body: JSON.stringify({ slug, extracted_data }),
      })
      if (!ok) return { content: [{ type: 'text' as const, text: `Save failed: ${data.error}` }] }
      const typed = extracted_data as { chapters?: unknown[]; companyName?: string }
      return {
        content: [{
          type: 'text' as const,
          text: `✓ Extraction saved for "${slug}"\nChapters: ${typed.chapters?.length ?? 0}\nCompany: ${typed.companyName}\n\nNext: call publish_microsite("${slug}")`,
        }],
      }
    }
  )

  // ── Tool 6: publish_microsite ───────────────────────────────────────────────
  server.tool(
    'publish_microsite',
    'Transform extracted data into microsite content, commit to Git, and trigger Vercel deployment. Site will be live within ~30 seconds.',
    {
      slug: z.string().describe('Company slug to publish'),
      theme_color: z.string().optional().describe('Optional hex theme color e.g. "#0057B8"'),
    },
    async ({ slug, theme_color }) => {
      const { ok, data } = await pipelineFetch('/api/pipeline/publish', {
        method: 'POST',
        body: JSON.stringify({ slug, themeColor: theme_color }),
      })
      if (!ok) return { content: [{ type: 'text' as const, text: `Publish failed: ${data.error}` }] }
      return {
        content: [{
          type: 'text' as const,
          text: `🚀 Microsite published!\nCompany: ${data.companyName}\nChapters: ${data.chaptersCount}\nCommit: ${data.commitSha ?? 'skipped'}\n${data.message}\n\nLive at: ${BASE_URL}/${slug}`,
        }],
      }
    }
  )

  return server
}

// ── Auth helper ──────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const mcpKey = process.env.MCP_API_KEY
  if (!mcpKey) return true
  return req.headers.get('authorization') === `Bearer ${mcpKey}`
}

// ── Route handlers ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless — no session tracking needed
  })

  const server = buildServer()
  await server.connect(transport)
  return transport.handleRequest(req)
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // For SSE-based clients (GET with Accept: text/event-stream)
  const accept = req.headers.get('accept') ?? ''
  if (accept.includes('text/event-stream')) {
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    })
    const server = buildServer()
    await server.connect(transport)
    return transport.handleRequest(req)
  }

  // Discovery endpoint
  return NextResponse.json({
    name: 'microsite-pipeline',
    version: '1.0.0',
    description: 'PDF → Benefits Microsite pipeline',
    tools: ['upload_pdf', 'parse_pdf', 'check_parse_status', 'get_markdown', 'save_extraction', 'publish_microsite'],
  })
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  const server = buildServer()
  await server.connect(transport)
  return transport.handleRequest(req)
}
