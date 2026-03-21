/**
 * Local MCP Server for Claude Desktop.
 *
 * Runs as a stdio process — Claude Desktop communicates via stdin/stdout.
 * Each tool call makes an HTTP request to the Vercel API.
 *
 * No session state issues. No mcp-remote needed.
 *
 * Config in claude_desktop_config.json:
 *   "command": "node",
 *   "args": ["C:\\...\\scripts\\mcp-server.mjs"]
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE_URL = 'https://dbh-demosite.vercel.app'
const API_KEY = '279bc05b39b067b73846df315e35fd3a6a549144bbe96c87b375fec14b879c21'

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-mcp-key': API_KEY,
      ...options.headers,
    },
  })
  const json = await res.json()
  return { ok: res.ok, data: json }
}

const server = new McpServer({ name: 'microsite-pipeline', version: '1.0.0' })

// ── Tool 1: upload_pdf ────────────────────────────────────────────────────────
server.tool(
  'upload_pdf',
  'Upload a PDF benefits guide and/or company logo (base64-encoded) to storage. Call this first.',
  {
    slug: z.string().describe('URL-safe company identifier, e.g. "acme-corp"'),
    pdf_base64: z.string().optional().describe('Base64-encoded PDF content'),
    logo_base64: z.string().optional().describe('Base64-encoded logo image content'),
    logo_mime: z.string().optional().describe('Logo MIME type: "image/png" or "image/jpeg"'),
  },
  async ({ slug, pdf_base64, logo_base64, logo_mime }) => {
    const { ok, data } = await api('/api/pipeline/upload', {
      method: 'POST',
      body: JSON.stringify({ slug, pdf_base64, logo_base64, logo_mime }),
    })
    if (!ok) return { content: [{ type: 'text', text: `Upload failed: ${data.error}` }] }
    return {
      content: [{
        type: 'text',
        text: `✓ Files uploaded for "${slug}"\n${data.pdf ? `PDF: ${data.pdf}` : ''}${data.logo ? `\nLogo: ${data.logo}` : ''}\n\nNext: call parse_pdf("${slug}")`,
      }],
    }
  }
)

// ── Tool 2: parse_pdf ─────────────────────────────────────────────────────────
server.tool(
  'parse_pdf',
  'Submit the uploaded PDF to LlamaParse. Returns job_id immediately. Then poll check_parse_status.',
  {
    slug: z.string().describe('Company slug'),
  },
  async ({ slug }) => {
    const { ok, data } = await api('/api/pipeline/parse', {
      method: 'POST',
      body: JSON.stringify({ slug }),
    })
    if (!ok) return { content: [{ type: 'text', text: `Parse failed: ${data.error}` }] }
    return {
      content: [{
        type: 'text',
        text: `✓ LlamaParse job started for "${slug}"\nJob ID: ${data.jobId}\n\nNow call check_parse_status("${slug}") every 5 seconds until status is "done".`,
      }],
    }
  }
)

// ── Tool 3: check_parse_status ────────────────────────────────────────────────
server.tool(
  'check_parse_status',
  'Check LlamaParse job. Returns "processing" or "done" with preview. Call every 5 seconds until done.',
  {
    slug: z.string().describe('Company slug'),
  },
  async ({ slug }) => {
    const { ok, data } = await api(`/api/pipeline/parse/status?slug=${encodeURIComponent(slug)}`)
    if (!ok) return { content: [{ type: 'text', text: `Status check failed: ${data.error}` }] }
    if (data.status === 'processing') {
      return { content: [{ type: 'text', text: `⏳ Still processing for "${slug}"... Call again in 5 seconds.` }] }
    }
    return {
      content: [{
        type: 'text',
        text: `✓ Parsing complete for "${slug}"\nWords: ${data.wordCount} | Sections: ${data.sectionCount}\n\nPreview:\n${data.preview}\n\nNext: call get_markdown("${slug}")`,
      }],
    }
  }
)

// ── Tool 4: get_markdown ──────────────────────────────────────────────────────
server.tool(
  'get_markdown',
  'Fetch the full parsed markdown. Read carefully and extract all benefit plans, premiums, contacts, eligibility.',
  {
    slug: z.string().describe('Company slug'),
  },
  async ({ slug }) => {
    const { ok, data } = await api(`/api/pipeline/parsed?slug=${encodeURIComponent(slug)}`)
    if (!ok) return { content: [{ type: 'text', text: `Fetch failed: ${data.error}` }] }
    return {
      content: [{
        type: 'text',
        text: `Markdown for "${slug}" (${data.markdown?.length ?? 0} chars):\n\n${data.markdown}`,
      }],
    }
  }
)

// ── Tool 5: save_extraction ───────────────────────────────────────────────────
server.tool(
  'save_extraction',
  'Save your structured ExtractedBenefitsData JSON to the database.',
  {
    slug: z.string().describe('Company slug'),
    extracted_data: z.record(z.any()).describe('Full ExtractedBenefitsData JSON. REQUIRED fields: companyName (string), chapters (array of objects). Each chapter MUST have: title (string), category (string — one of: medical, dental, vision, hdhp, hmo, ppo, fsa-hsa, hsa, eap, supplemental, disability, life-insurance, retirement, wellness, paid-time-off, voluntary-benefits, eligibility, overview, other), contentParagraphs (array of strings), description (string). Do NOT use fields named "details", "summary", "content", or "paragraphs" — use contentParagraphs instead.'),
  },
  async ({ slug, extracted_data }) => {
    const { ok, data } = await api('/api/pipeline/parsed', {
      method: 'POST',
      body: JSON.stringify({ slug, extracted_data }),
    })
    if (!ok) return { content: [{ type: 'text', text: `Save failed: ${data.error}` }] }
    return {
      content: [{
        type: 'text',
        text: `✓ Extraction saved for "${slug}"\nChapters: ${extracted_data.chapters?.length ?? 0}\nCompany: ${extracted_data.companyName}\n\nNext: call publish_microsite("${slug}")`,
      }],
    }
  }
)

// ── Tool 6: publish_microsite ─────────────────────────────────────────────────
server.tool(
  'publish_microsite',
  'Transform extracted data, commit to Git, deploy via Vercel. Site live in ~30 seconds.',
  {
    slug: z.string().describe('Company slug to publish'),
    theme_color: z.string().optional().describe('Optional hex color e.g. "#0057B8"'),
  },
  async ({ slug, theme_color }) => {
    const { ok, data } = await api('/api/pipeline/publish', {
      method: 'POST',
      body: JSON.stringify({ slug, themeColor: theme_color }),
    })
    if (!ok) return { content: [{ type: 'text', text: `Publish failed: ${data.error}` }] }
    return {
      content: [{
        type: 'text',
        text: `🚀 Microsite published!\nCompany: ${data.companyName}\nChapters: ${data.chaptersCount}\nCommit: ${data.commitSha ?? 'skipped'}\n${data.message}\n\nLive at: ${BASE_URL}/${slug}`,
      }],
    }
  }
)

// ── Start ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport()
await server.connect(transport)
