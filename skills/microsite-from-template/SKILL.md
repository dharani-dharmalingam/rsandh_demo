---
name: microsite-from-template
description: Create or update a microsite by transforming extracted variables into the project's EmployerContent format and writing a published content file. Use this skill whenever the user wants to generate a new employer portal, populate a site template with extracted data, or finalize the PDF-to-microsite pipeline. Trigger on any mention of "create microsite", "generate employer site", "populate template", "publish content", or as the third step after extract-document-variables.
---

# Microsite from Template

Take `ExtractedBenefitsData` JSON (output of `extract-document-variables`) and produce a fully deployable employer microsite by writing `content/<slug>.published.json`. The app reads this file to serve all employer-specific pages.

## Pipeline context

```
content/<slug>-extracted.json  →  [this skill]  →  content/<slug>.published.json
                                                  →  live microsite at /<slug>/*
```

## How the app serves microsites

The Next.js app routes employer requests based on the slug. All employer pages under `app/(employer)/` read content via `lib/content/index.ts`:

- `getPublishedContent(slug)` → reads `content/<slug>.published.json`
- `getDraftContent(slug)` → reads draft first, falls back to published
- `saveContent(slug, data)` → writes `content/<slug>.draft.json`
- `publishContent(slug)` → promotes draft to published

The `app/(employer)/layout.tsx` loads the content and passes site settings + chapters to `Header` and `Footer` components. Each page route (benefits, contacts, enrollment-checklist, etc.) reads the relevant section from the same content file.

The root type is `EmployerContent` in `lib/content/types.ts`.

## Transform chain

The project has two transform functions that do the heavy lifting:

```
ExtractedBenefitsData  →  transformToSanitySchema()  →  SanitySeedPayload
                       →  seedPayloadToLocalContent() →  EmployerContent
```

**Use these functions.** Don't rebuild the transform logic by hand. They handle:
- Mapping chapter categories to icons (`CATEGORY_ICON_MAP` in `transform.ts`)
- Converting plain paragraphs to Sanity Portable Text blocks
- Generating deterministic `_id` values and slugs
- Creating default quick-access cards, footer links, and enrollment labels
- Building unified table structures with `_key` fields

```typescript
import { transformToSanitySchema } from '@/lib/benefits-import/transform'
import { seedPayloadToLocalContent } from '@/lib/benefits-import/to-local-content'
import { saveContent, publishContent } from '@/lib/content'
import type { ExtractedBenefitsData } from '@/lib/benefits-import/types'
import fs from 'fs'

const slug = 'premier-america'

// 1. Load extracted variables
const extracted: ExtractedBenefitsData = JSON.parse(
  fs.readFileSync(`content/${slug}-extracted.json`, 'utf-8')
)

// 2. Transform through the pipeline
const seed = await transformToSanitySchema(extracted, slug)
const content = seedPayloadToLocalContent(seed)

// 3. Optionally add logo and benefits guide URL
// content.siteSettings.clientLogo = '<URL-to-logo>'
// content.openEnrollment.benefitsGuideUrl = '<URL-to-PDF>'

// 4. Save as draft, then publish
saveContent(slug, content)
publishContent(slug)

console.log(`Microsite ready: content/${slug}.published.json`)
```

## Serverless path (Supabase + Git)

When running on Vercel or another serverless platform, the filesystem is read-only. The existing `app/api/benefits-import/phase2/route.ts` handles this by:

1. Writing to Supabase `content_drafts` table via `upsertContentJson(slug, content)`.
2. Committing to the Git repo via `commitContentToGit(slug, content)` (requires `GITHUB_TOKEN` and `GITHUB_REPO` env vars).

If you're running this skill in a serverless context, follow the same pattern. Check `isContentWrittenToTmp()` from `lib/content/index.ts` to detect serverless.

## EmployerContent structure

The final JSON written to `content/<slug>.published.json` (see `lib/content/types.ts`):

```
{
  client:              { name, slug, themeColor }
  siteSettings:        { clientName, shortName, clientLogo?, logoText, footerAbout,
                         quickLinks[], quickAccess[], contactInfo[], copyrightText, ... }
  benefitsPage:        { title, description }
  benefitChapters:     [{ _id, title, description, slug, icon, content (PortableText),
                          tables[{ _key, tableTitle, columns[], rows[] }], order }]
  openEnrollment:      { title, description, daysLeftLabel, periodLabel, benefitsGuideUrl?, ... }
  benefitChangesPage:  { title, description, changes[] }
  enrollmentChecklist: { title, description, items[{ step, title, description }] }
  retirementPlanning:  { heroTitle, heroDescription, sections[] }
  documents:           []
}
```

## Slug conventions

- Use lowercase, hyphenated slugs: `premier-america`, `rs-h`, `defender-supply`.
- The slug appears in all URLs: `/<slug>/benefits`, `/<slug>/contacts`, etc.
- Check existing slugs: `ls content/*.published.json` or call `listEmployers()` from `lib/content/index.ts`.
- Set `NEXT_PUBLIC_DEFAULT_EMPLOYER=<slug>` in `.env.local` if subdomain routing isn't set up locally.

## Available employer routes

| Route | Page | Content source |
|-------|------|----------------|
| `/<slug>` | Landing page | `openEnrollment`, `siteSettings.quickAccess` |
| `/<slug>/benefits` | Benefits overview | `benefitsPage`, `benefitChapters` |
| `/<slug>/benefits/<chapter-slug>` | Chapter detail | `benefitChapters[n]` |
| `/<slug>/contacts` | Contact info | `siteSettings.contactInfo` |
| `/<slug>/document-hub` | Documents | `documents[]` |
| `/<slug>/enrollment-checklist` | Checklist | `enrollmentChecklist` |
| `/<slug>/benefit-changes` | Changes | `benefitChangesPage` |
| `/<slug>/retirement-planning` | Retirement | `retirementPlanning` |

## After writing the file

1. **Verify** the file was written: `ls content/<slug>.published.json`
2. **Start dev server** if not running: `npm run dev`
3. **Visit** `http://localhost:3000/<slug>` to preview
4. **Spot-check** benefits and contacts pages for content and table accuracy

## Customization after generation

The content file is plain JSON — edit directly before or after publishing:

| Field | Path in JSON | Notes |
|-------|-------------|-------|
| Logo URL | `siteSettings.clientLogo` | Supabase URL or local `/content/uploads/` path |
| Theme color | `client.themeColor` | Hex string (e.g. `"#1e40af"`) |
| Hero title | `openEnrollment.title` | Landing page heading |
| Quick access cards | `siteSettings.quickAccess[]` | 3 cards on landing page |
| Chapter order | `benefitChapters[].order` | Lower = first |
| Benefits guide PDF | `openEnrollment.benefitsGuideUrl` | Link for download |

## Existing content files for reference

- `content/rs-h.published.json` — full example with all fields populated
- `content/premier-america.published.json` — another complete reference
- `content/defender-supply.published.json` — third reference

Read these to understand the expected structure when debugging or manually authoring content.

## Checklist

- [ ] `content/<slug>-extracted.json` exists and validates (non-empty `companyName` and `chapters`)
- [ ] Slug is unique — run `ls content/*.published.json`
- [ ] `transformToSanitySchema()` + `seedPayloadToLocalContent()` ran without errors
- [ ] `content/<slug>.published.json` written successfully
- [ ] App serves `/<slug>` correctly in dev
