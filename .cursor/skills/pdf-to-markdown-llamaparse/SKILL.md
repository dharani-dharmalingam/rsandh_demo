---
name: pdf-to-markdown-llamaparse
description: Convert PDF files to Markdown using LlamaParse (Llama Cloud). Use this skill whenever the user wants to parse a PDF into markdown, extract text from PDFs for downstream processing, or prepare PDF content for variable extraction or AI analysis. Trigger on any mention of PDF-to-markdown, document parsing, LlamaParse, Llama Cloud, "parse this PDF", "convert benefits guide", or uploading a PDF as the first step of the microsite pipeline.
---

# PDF to Markdown with LlamaParse

Convert a PDF benefits guide (or any employer document) to Markdown using the LlamaParse API. The output feeds the `extract-document-variables` skill in the microsite pipeline.

## Important: LlamaParse vs LlamaExtract

This project's existing import pipeline (`lib/benefits-import/extract.ts`) uses **LlamaExtract** — it sends a JSON schema alongside the PDF and gets structured JSON back directly (no markdown intermediate). That flow is exposed in the admin UI at `/admin`.

**This skill uses LlamaParse instead** — it converts the PDF to markdown first. Use this when:
- You want a human-readable intermediate for review before extraction.
- The PDF doesn't fit the structured extraction schemas well.
- You need markdown as input for LLM-assisted variable extraction.

Both LlamaParse and LlamaExtract share the same API key (`LLAMA_CLOUD_API_KEY`) and base URL (`https://api.cloud.llamaindex.ai`).

## Pipeline context

```
PDF  →  [this skill]  →  content/<slug>-parsed.md
     →  extract-document-variables
     →  microsite-from-template
```

## Prerequisites

- `LLAMA_CLOUD_API_KEY` in `.env.local` (already used by the project for LlamaExtract).
- The PDF must be accessible as a local file path or a Supabase storage path.

## Steps

### 1. Resolve the PDF

- **Local file**: use the path directly (e.g. `content/uploads/<slug>-benefits-guide.pdf`).
- **Supabase storage** (e.g. `rs-h/benefits-guide.pdf`): download using `downloadAsBuffer(path)` from `lib/supabase/storage.ts`.

### 2. Call LlamaParse

#### Option A: REST API (recommended — mirrors project conventions)

The project already calls `api.cloud.llamaindex.ai` in `lib/benefits-import/extract.ts`. LlamaParse uses the same host but the `/api/v1/parsing` endpoints.

```typescript
import fs from 'fs'

const apiKey = process.env.LLAMA_CLOUD_API_KEY!
const LLAMA_API_BASE = 'https://api.cloud.llamaindex.ai'

// 1. Upload the file
const formData = new FormData()
formData.append('file', new Blob([fs.readFileSync(pdfPath)]), 'benefits-guide.pdf')

const uploadRes = await fetch(`${LLAMA_API_BASE}/api/v1/parsing/upload`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}` },
  body: formData,
})
const { id: jobId } = await uploadRes.json()

// 2. Poll for completion
let status = 'PENDING'
while (status === 'PENDING' || status === 'RUNNING') {
  await new Promise(r => setTimeout(r, 5000))
  const statusRes = await fetch(`${LLAMA_API_BASE}/api/v1/parsing/job/${jobId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  const job = await statusRes.json()
  status = job.status
}

// 3. Fetch markdown result
const resultRes = await fetch(`${LLAMA_API_BASE}/api/v1/parsing/job/${jobId}/result/markdown`, {
  headers: { Authorization: `Bearer ${apiKey}` },
})
const { markdown } = await resultRes.json()
```

If the exact endpoint paths have changed, consult the LlamaParse API docs (v2). The pattern is always: upload → poll → fetch result.

#### Option B: Python SDK

```bash
pip install llama-cloud>=1.0
```

```python
from llama_cloud import AsyncLlamaCloud
import asyncio, os

async def parse_pdf(pdf_path: str) -> str:
    client = AsyncLlamaCloud(token=os.environ["LLAMA_CLOUD_API_KEY"])
    file_obj = await client.files.create(file=pdf_path, purpose="parse")
    result = await client.parsing.parse(
        file_id=file_obj.id,
        tier="agentic",
        version="latest",
        expand=["markdown"],
    )
    return "\n\n".join(page.markdown for page in result.markdown.pages)

markdown = asyncio.run(parse_pdf("benefits-guide.pdf"))
```

#### Option C: Node SDK (@llamaindex/llama-cloud)

```bash
npm install @llamaindex/llama-cloud
```

Use the package's file upload and parsing APIs. The SDK wraps the same REST endpoints above. Refer to the package README for the current class names and method signatures.

### 3. Save the output

Write the markdown to `content/<slug>-parsed.md` (UTF-8). The slug should match the employer slug used for the microsite (e.g. `premier-america`, `rs-h`).

```typescript
import path from 'path'
import fs from 'fs'

const slug = 'premier-america'
const outPath = path.join(process.cwd(), 'content', `${slug}-parsed.md`)
fs.writeFileSync(outPath, markdown, 'utf-8')
```

## Quality tips

- Use `tier: 'agentic'` for benefits PDFs — they have complex tables and multi-column layouts. The agentic tier preserves table structure as markdown tables, which is critical for the extraction step.
- Preserve headings, bullet lists, and tables exactly — the variable extraction skill relies on markdown structure (`##` headings map to benefit chapters, markdown tables map to plan comparison tables).
- If pages come back empty or garbled, check for password-protected PDFs or try a different tier.

## Output

| Item | Convention |
|------|------------|
| File | `content/<slug>-parsed.md` |
| Encoding | UTF-8 |
| Structure | Headings preserved; tables as markdown tables; lists as bullet/numbered |

## Next step

Hand the output path to the `extract-document-variables` skill:
> "Now extract variables from `content/premier-america-parsed.md`"
