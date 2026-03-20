# Claude Skills — PDF → Markdown → Variables → Microsite

Three skills that form an alternative import pipeline for the RS&H Benefit Hub. Instead of the existing LlamaExtract path (PDF → structured JSON directly), this pipeline goes through a markdown intermediate for more flexibility and human review.

## Skills

| # | Skill | What it does |
|---|-------|-------------|
| 1 | **pdf-to-markdown-llamaparse** | Converts a PDF benefits guide to Markdown using LlamaParse (Llama Cloud). |
| 2 | **extract-document-variables** | Extracts structured variables (JSON matching `ExtractedBenefitsData`) from the markdown. |
| 3 | **microsite-from-template** | Transforms variables into `EmployerContent` and writes `content/<slug>.published.json`. |

## Pipeline

```
PDF (upload or Supabase)
 │
 ▼  pdf-to-markdown-llamaparse
content/<slug>-parsed.md
 │
 ▼  extract-document-variables
content/<slug>-extracted.json   (ExtractedBenefitsData)
 │
 ▼  microsite-from-template
content/<slug>.published.json   (EmployerContent)
 │
 ▼  Next.js app
/<slug>/*  (live microsite)
```

## How this relates to the existing pipeline

The existing admin import (`/admin` → `/api/benefits-import`) uses **LlamaExtract** to go directly from PDF → structured JSON. It never produces markdown. That flow is fully automated and works well for standard benefits guides.

This skill-based pipeline is useful when:
- You want to inspect the markdown before extraction.
- The PDF has unusual structure that doesn't fit the LlamaExtract schemas.
- You want to use LLM-assisted extraction from markdown instead.

Both pipelines produce the same final output (`EmployerContent` JSON) and use the same transform functions (`transformToSanitySchema`, `seedPayloadToLocalContent`).

## Environment

- `LLAMA_CLOUD_API_KEY` — required for LlamaParse (step 1). Already in `.env.local` for the existing pipeline.
- `LLAMA_CLOUD_PROJECT_ID` — optional.
- `GITHUB_TOKEN` + `GITHUB_REPO` — for serverless Git commit (step 3, optional).
