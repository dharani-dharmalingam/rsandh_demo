---
name: pdf-to-markdown-llamaparse
description: Convert PDF files to Markdown using LlamaParse (Llama Cloud). Use this skill whenever the user wants to parse a PDF into markdown, extract text from PDFs for downstream processing, or prepare PDF content for variable extraction or AI analysis. Trigger on any mention of PDF-to-markdown, document parsing, LlamaParse, Llama Cloud, "parse this PDF", "convert benefits guide", "parse the PDF for <slug>", uploading a PDF as the first step of the microsite pipeline.
---

# Skill 1 — PDF to Markdown (LlamaParse)

**Pipeline role:** First step. Downloads the PDF from Supabase Storage, converts it to Markdown via LlamaParse, and saves the result to the `parsed_documents` table for review and Skill 2.

## Pipeline context

```
Supabase Storage: {slug}/benefits-guide.pdf
     ↓  [this skill — POST /api/pipeline/parse]
parsed_documents table: { slug, markdown, word_count, storage_path }
     ↓
Skill 2: extract-document-variables
```

## Prerequisites

- PDF already uploaded to Supabase Storage at `{slug}/benefits-guide.pdf`
  (the admin upload step or a direct Supabase upload handles this)
- `LLAMA_CLOUD_API_KEY` set in environment
- Supabase configured (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)

## Steps

### 1. Call the parse API

```http
POST /api/pipeline/parse
Content-Type: application/json

{ "slug": "<employer-slug>" }
```

Example:
```http
POST /api/pipeline/parse
{ "slug": "rs-h" }
```

### 2. Show the checkpoint output

The API returns:

```json
{
  "success": true,
  "slug": "rs-h",
  "wordCount": 4218,
  "sectionCount": 12,
  "storagePath": "rs-h/benefits-guide.pdf",
  "preview": "## Medical Benefits\n\n| Plan | PPO | HDHP |...",
  "nextStep": "Markdown saved. Review the preview above, then say: \"extract variables for rs-h\""
}
```

Display this to the user:
- Word count and section count — are they reasonable for a benefits guide?
- Preview — do headings and table structure look correct?
- Flag any obvious issues: garbled text, missing sections, empty preview

### 3. Prompt for Skill 2

After showing the output, say:

> Parsed markdown saved to `parsed_documents` for **{slug}** ({wordCount} words, {sectionCount} sections).
>
> **Preview:**
> ```
> {preview}
> ```
>
> Does the structure look correct? If yes, say: **"extract variables for {slug}"**

Wait for the user to confirm before triggering Skill 2.

## Quality notes

- LlamaParse uses the `agentic` tier internally for benefits PDFs — preserves table structure as markdown tables.
- If `sectionCount` is 0 or `wordCount` is under 500, flag it — the PDF may be scanned/image-only or password-protected.
- If the preview shows garbled characters, the PDF encoding may need attention before proceeding.

## What's stored

| Table | Column | Value |
|---|---|---|
| `parsed_documents` | `slug` | employer slug (PK) |
| `parsed_documents` | `markdown` | full LlamaParse markdown |
| `parsed_documents` | `storage_path` | `{slug}/benefits-guide.pdf` |
| `parsed_documents` | `word_count` | integer |

## Next step

Once the user confirms the preview looks good:
> "extract variables for {slug}"

This triggers Skill 2 (`extract-document-variables`).
