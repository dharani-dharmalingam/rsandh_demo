---
name: microsite-from-template
description: Create or update a microsite by transforming extracted variables into the project's EmployerContent format, saving to Supabase, and committing to Git for Vercel deployment. Use this skill whenever the user wants to generate a new employer portal, publish a site, or finalize the PDF-to-microsite pipeline. Trigger on any mention of "create microsite", "publish <slug>", "generate employer site", "populate template", or as the third step after extract-document-variables.
---

# Skill 3 — Publish Microsite

**Pipeline role:** Final step. Reads `ExtractedBenefitsData` from `extracted_documents`, transforms it into `EmployerContent`, saves to `content_drafts`, commits `content/<slug>.published.json` to Git, and Vercel deploys automatically.

## Pipeline context

```
extracted_documents table: { slug, extracted_data }
     ↓  [this skill — POST /api/pipeline/publish]
content_drafts table: { slug, content }  +  Git commit → Vercel deploy
     ↓
Live microsite at /{slug}
```

## Steps

### 1. Call the publish API

```http
POST /api/pipeline/publish
Content-Type: application/json

{
  "slug": "<employer-slug>",
  "logoAssetId": "<slug>/logo.png",   // optional — defaults to {slug}/logo.png
  "themeColor": "#1e40af"             // optional — overrides extracted value
}
```

Example:
```http
POST /api/pipeline/publish
{ "slug": "rs-h" }
```

### 2. What the API does (no action needed)

The route handles everything:
1. Reads `extracted_data` from `extracted_documents` for the slug
2. Runs `transformToSanitySchema()` + `seedPayloadToLocalContent()` from the existing transform pipeline
3. Sets `siteSettings.clientLogo` = Supabase public URL for `{slug}/logo.png`
4. Sets `openEnrollment.benefitsGuideUrl` = Supabase public URL for `{slug}/benefits-guide.pdf`
5. Saves the result to `content_drafts` via `upsertContentJson()`
6. Commits `content/{slug}.published.json` to Git via GitHub API → Vercel deploys

### 3. Show the final checkpoint

The API returns:
```json
{
  "success": true,
  "slug": "rs-h",
  "chaptersCount": 14,
  "companyName": "RS&H",
  "committedToGit": true,
  "commitSha": "abc1234",
  "message": "Published \"rs-h\" and committed to Git. Vercel is deploying."
}
```

Display to the user:

> **Microsite published for {companyName} (`{slug}`)**
>
> - **Chapters:** {chaptersCount}
> - **Git commit:** `{commitSha}`
> - **Status:** Vercel is deploying — site will be live at `/{slug}` in ~30 seconds
>
> ✓ Content saved to `content_drafts` table
> ✓ `content/{slug}.published.json` committed to Git
> ✓ Vercel deployment triggered automatically

If `committedToGit` is false, show the message from the API and advise the user to check `GITHUB_TOKEN` and `GITHUB_REPO` env vars.

## What's stored / committed

| Destination | What |
|---|---|
| `content_drafts` table | Full `EmployerContent` JSON (slug PK) |
| Git repo | `content/{slug}.published.json` |
| Vercel | Auto-deploy triggered by the Git commit |

## App routes served after publish

| Route | Page |
|---|---|
| `/{slug}` | Landing page |
| `/{slug}/benefits` | Benefits overview |
| `/{slug}/benefits/{chapter}` | Chapter detail |
| `/{slug}/contacts` | Contact info |
| `/{slug}/enrollment-checklist` | Checklist |
| `/{slug}/benefit-changes` | Changes |
| `/{slug}/retirement-planning` | Retirement |
| `/{slug}/document-hub` | Documents |

## Post-publish customisation

To adjust content after publishing, edit the row in `content_drafts` directly in Supabase, or re-run this skill with overrides:

| Override | How |
|---|---|
| Theme color | Add `"themeColor": "#hex"` to the POST body |
| Logo | Upload a new logo to Supabase Storage at `{slug}/logo.png`, then re-run |
| Chapter content | Edit `extracted_documents.extracted_data` in Supabase, then re-run Skill 3 |

## Troubleshooting

| Symptom | Fix |
|---|---|
| `No extracted data found` | Run Skill 2 first — `extracted_documents` is empty for this slug |
| `committedToGit: false` | Set `GITHUB_TOKEN` (PAT with `repo` scope) and `GITHUB_REPO` (`owner/repo`) in Vercel env vars |
| Logo shows as broken | Confirm the logo was uploaded to `{slug}/logo.png` in the `employer-assets` Supabase bucket |
