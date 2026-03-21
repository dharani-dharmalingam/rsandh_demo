---
name: extract-document-variables
description: Extract structured variables from the parsed markdown stored in Supabase. Use this skill whenever the user wants to pull named fields from a parsed benefits guide — company name, plan names, benefit chapters, contact info, premium tables, etc. — to feed the microsite pipeline. Trigger on any mention of "extract variables", "extract for <slug>", "parse into JSON", "get fields from document", "structured extraction", or as the second step after pdf-to-markdown-llamaparse.
---

# Skill 2 — Extract Document Variables

**Pipeline role:** Second step. Reads the parsed markdown from `parsed_documents`, performs two-phase LLM-assisted extraction (Claude does this directly), and saves the result to `extracted_documents`.

## Pipeline context

```
parsed_documents table: { slug, markdown }
     ↓  [this skill — GET /api/pipeline/parsed + POST /api/pipeline/parsed]
extracted_documents table: { slug, extracted_data }
     ↓
Skill 3: microsite-from-template
```

## Steps

### Phase 1 — Fetch markdown and detect structure

#### 1. Fetch the markdown

```http
GET /api/pipeline/parsed?slug=<slug>
```

Returns:
```json
{
  "slug": "rs-h",
  "markdown": "## Medical Benefits\n...",
  "wordCount": 4218,
  "storagePath": "rs-h/benefits-guide.pdf"
}
```

#### 2. Analyze the markdown (Claude does this — no extra API call)

Scan the markdown and extract the Phase 1 structure:

```typescript
interface Phase1Result {
  companyName: string        // first # heading or "Company: ..." line
  themeColor?: string        // hex if visible, otherwise null
  medicalPlans: string[]     // column headers in medical comparison tables
  dentalPlans: string[]      // column headers in dental tables
  visionPlans: string[]      // column headers in vision tables
  premiumTiers: string[]     // row labels: "Employee Only", "Family", etc.
  chaptersList: string[]     // all ## headings
}
```

Rules for finding each field:
- `companyName` → first `# Heading` or a "Company: …" line near the top
- `medicalPlans` → column headers in tables under "Medical" section (e.g. "PPO", "HDHP")
- `dentalPlans`, `visionPlans` → same pattern in dental/vision sections
- `premiumTiers` → row labels in premium tables (e.g. "Employee Only", "Employee + Spouse", "Family")
- `chaptersList` → every `## Heading` title
- `themeColor` → usually not in markdown; default to `null`

#### 3. Show Phase 1 checkpoint

Display the detected structure:

> **Phase 1 — Detected structure for {slug}**
>
> - **Company:** {companyName}
> - **Medical plans:** {medicalPlans.join(', ')}
> - **Dental plans:** {dentalPlans.join(', ')}
> - **Vision plans:** {visionPlans.join(', ')}
> - **Premium tiers:** {premiumTiers.join(', ')}
> - **Chapters ({n}):** {chaptersList.join(', ')}
>
> Does this look right? Should any chapters or plans be added or removed?

**Wait for the user to confirm or correct before proceeding to Phase 2.**

---

### Phase 2 — Full extraction

With the confirmed plan names and chapter list, extract the complete `ExtractedBenefitsData` from the markdown.

#### Target schema (from `lib/benefits-import/types.ts`)

```typescript
interface ExtractedBenefitsData {
  companyName: string
  themeColor?: string
  chapters: ExtractedChapter[]
  detectedPlans: DetectedPlans        // confirmed values from Phase 1
  landingPage?: { heroTitle, heroSubtitle, ... }
  retirementPlanning?: { ... }
  contactInfo?: { label, value, href?, groupNumber? }[]
  quickLinks?: { label, href }[]
  quickAccess?: { title, description, href, iconName? }[]
  enrollmentChecklist?: { title, description }[]
  benefitChanges?: { type: 'new'|'update', title, description }[]
}
```

#### Mapping rules

| Markdown pattern | Schema field |
|---|---|
| First `# Heading` | `companyName` |
| `## <Chapter Title>` | One `ExtractedChapter` per heading |
| Markdown tables | `ExtractedTable` with `columns[]` + `rows[]` |
| Bullet/numbered lists | `sections[].paragraphs` with `isList: true` |
| Phone / Email / Website lines | `contactInfo[]` |
| Step-by-step checklist items | `enrollmentChecklist[]` |

#### BenefitCategory values
`eligibility` `overview` `medical` `hdhp` `hmo` `ppo` `dental` `vision` `fsa-hsa` `hsa` `eap` `supplemental` `disability` `life-insurance` `retirement` `pet-insurance` `college-savings` `wellness` `paid-time-off` `voluntary-benefits` `other`

#### ExtractedTable rules
- `cells[]` must have the same length as `columns[]` and in the same order
- Use `isSection: true` for category-header rows, not data rows
- `tableTitle` should be descriptive (e.g. "Medical Premium Rates")

#### Validation before saving
- `companyName` is a non-empty string
- `chapters` is a non-empty array
- Each chapter has `title`, `category`, and `contentParagraphs`
- `detectedPlans` has at least one plan in `medicalPlans`, `dentalPlans`, or `visionPlans`
- All table `cells[]` arrays match their `columns[]` length

---

### Save Phase 2 — Checkpoint

After extracting, save to `extracted_documents` via:

```http
POST /api/pipeline/parsed
Content-Type: application/json

{
  "slug": "<slug>",
  "extracted_data": { ...ExtractedBenefitsData }
}
```

Returns:
```json
{
  "success": true,
  "slug": "rs-h",
  "chaptersCount": 14,
  "companyName": "RS&H",
  "nextStep": "Extracted data saved. Review the chapter list above, then say: \"publish rs-h\""
}
```

#### Show the Phase 2 checkpoint

> **Extraction complete for {slug}**
>
> - **Company:** {companyName}
> - **Chapters ({chaptersCount}):** {chapters.map(c => c.title).join(', ')}
> - **Medical:** {detectedPlans.medicalPlans.join(', ')}
> - **Dental:** {detectedPlans.dentalPlans.join(', ')}
> - **Vision:** {detectedPlans.visionPlans.join(', ')}
>
> Does this look right? If yes, say: **"publish {slug}"**

Wait for the user to confirm before triggering Skill 3.

## What's stored

| Table | Column | Value |
|---|---|---|
| `extracted_documents` | `slug` | employer slug (PK) |
| `extracted_documents` | `extracted_data` | full `ExtractedBenefitsData` JSONB |

## Next step

Once the user confirms:
> "publish {slug}"

This triggers Skill 3 (`microsite-from-template`).
