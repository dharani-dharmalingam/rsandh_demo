---
name: extract-document-variables
description: Extract structured variables from a markdown or text document using the project's extraction schema. Use this skill whenever the user wants to pull named fields from a converted PDF or markdown file — company name, plan names, benefit chapters, contact info, premium tables, etc. — to feed the microsite pipeline. Trigger on any mention of "extract variables", "parse into JSON", "get fields from document", "structured extraction", or as the second step after pdf-to-markdown-llamaparse.
---

# Extract Variables from Document

Convert a parsed markdown document (output of `pdf-to-markdown-llamaparse`) into structured JSON that matches the project's `ExtractedBenefitsData` type. This JSON is the input for the `microsite-from-template` skill.

## Pipeline context

```
content/<slug>-parsed.md  →  [this skill]  →  content/<slug>-extracted.json
                                             →  microsite-from-template
```

## How the existing pipeline does it (for reference)

The project's current import (`lib/benefits-import/extract.ts`) skips the markdown step entirely: it sends the raw PDF + a JSON schema to the LlamaExtract API and gets structured JSON back. The `assembleExtractedData()` function in that file shows exactly how the API response is shaped into `ExtractedBenefitsData`.

This skill does the equivalent, but from **markdown** input rather than PDF. Since LlamaExtract can't take markdown, you'll use LLM-assisted extraction or rule-based parsing instead.

## Target schema

The output must match `ExtractedBenefitsData` from `lib/benefits-import/types.ts`. Read that file first. Key shape:

```typescript
interface ExtractedBenefitsData {
  companyName: string
  themeColor?: string                // hex, e.g. "#1e40af"
  chapters: ExtractedChapter[]       // one per benefit section
  detectedPlans: DetectedPlans       // plan names and tier names
  landingPage?: { heroTitle, heroSubtitle, ... }
  retirementPlanning?: { ... }
  contactInfo?: { label, value, href?, groupNumber? }[]
  quickLinks?: { label, href }[]
  quickAccess?: { title, description, href, iconName? }[]
  enrollmentChecklist?: { title, description }[]
  benefitChanges?: { type: 'new'|'update', title, description }[]
}
```

### DetectedPlans

```typescript
interface DetectedPlans {
  medicalPlans: string[]    // e.g. ["PPO", "HDHP", "HMO"]
  dentalPlans: string[]     // e.g. ["Core Plan", "Enhanced Plan"]
  visionPlans: string[]     // e.g. ["Core VSP", "Enhanced VSP"]
  premiumTiers: string[]    // e.g. ["Employee Only", "Employee + Spouse", "Family"]
}
```

### ExtractedChapter

Each chapter in `chapters[]` must have:

```typescript
interface ExtractedChapter {
  title: string
  description: string                   // 1–2 sentence summary
  category: BenefitCategory
  contentParagraphs: string[]
  sections?: ExtractedChapterSection[]  // sub-headings with paragraphs
  tables?: ExtractedTable[]
  tabs?: { title, contentParagraphs, link?, linkLabel? }[]
}
```

`BenefitCategory` values (from `lib/benefits-import/types.ts`):
`eligibility`, `overview`, `medical`, `hdhp`, `hmo`, `ppo`, `dental`, `vision`, `fsa-hsa`, `hsa`, `eap`, `supplemental`, `disability`, `life-insurance`, `retirement`, `pet-insurance`, `college-savings`, `wellness`, `paid-time-off`, `voluntary-benefits`, `other`.

### ExtractedTable

```typescript
interface ExtractedTable {
  templateId?: string       // links to TABLE_TEMPLATES in tableTemplates.ts (optional)
  tableTitle: string
  tableDescription?: string
  columns: { key: string; label: string; subLabel?: string }[]
  rows: { label: string; cells: string[]; isSection?: boolean }[]
}
```

`cells[]` must match `columns[]` in length and order. Use `isSection: true` for rows that are category headers (e.g. "Retail (30-day)") rather than data rows.

### ExtractedChapterSection

```typescript
interface ExtractedChapterSection {
  title: string
  paragraphs: string[]
  isList?: boolean   // when true, paragraphs render as bullet list items
}
```

## Two-phase extraction (recommended)

### Phase 1 — detect plans and chapters (lightweight)

Produce a `Phase1Result` first and confirm structure with the user:

```typescript
interface Phase1Result {
  detectedPlans: DetectedPlans
  chaptersList: string[]     // e.g. ["Medical", "Dental", "Vision", "FSA", "EAP", "Eligibility"]
  companyName: string
  themeColor?: string
}
```

To build this from markdown:
- `companyName` → first `# Heading` or a "Company: …" line near the top.
- `medicalPlans` → look for plan name labels in comparison tables (e.g. column headers "PPO", "HDHP").
- `dentalPlans`, `visionPlans` → same pattern in dental/vision sections.
- `premiumTiers` → row labels in premium tables (e.g. "Employee Only", "Employee + Spouse").
- `chaptersList` → all `## Heading` titles.
- `themeColor` → usually not in markdown (it comes from PDF visuals). Default to `null` and let the microsite step fill it.

Show Phase 1 results to the user and ask: "Does this look right? Should I add or remove any chapters or plans?"

### Phase 2 — full extraction

With confirmed plan names and chapter list, extract the complete `ExtractedBenefitsData`. The project's template system (`lib/benefits-import/templates/`) defines the chapter types and expected fields:

| Template | Category | Key fields |
|----------|----------|------------|
| `overview` | `overview` | Premium tables per benefit type |
| `eligibility` | `eligibility` | Requirements, dependents, enrollment, QLE |
| `medical` | `medical` | Per-plan premiums, benefits summary, Rx tables |
| `dental` | `dental` | Per-plan benefit rows (in/out of network) |
| `vision` | `vision` | Per-plan benefit rows + frequency |
| `eap` | `eap` | Services, free visits, availability |
| `fsa-hsa` | `fsa-hsa` | HSA/FSA definitions, contribution tables |
| `survivor-benefits` | `life-insurance` | Coverage, age reduction, AD&D |
| `supplemental-health` | `supplemental` | Critical illness, accident tables |
| `income-protection` | `disability` | STD/LTD tables |
| `financial-wellbeing` | `retirement` | 401k limits, vesting, matching |
| `paid-time-off` | `paid-time-off` | Holidays, vacation accrual |
| `voluntary-benefits` | `voluntary-benefits` | Tabbed benefit cards |
| `dynamic` | varies | Catch-all for unmatched chapters |

Read the template files in `lib/benefits-import/templates/` to see the exact field shapes for each chapter type.

## Extraction approach

### Read the document

```typescript
import fs from 'fs'
const markdown = fs.readFileSync('content/<slug>-parsed.md', 'utf-8')
```

### Map document structure to schema

| Markdown pattern | Schema field |
|------------------|--------------|
| First `# Heading` or "Company: …" | `companyName` |
| `## <Chapter Title>` | One `ExtractedChapter` per heading |
| Markdown tables | `ExtractedTable` with `columns[]` + `rows[]` |
| Bullet/numbered lists | Arrays or `sections[].paragraphs` with `isList: true` |
| Phone / Email / Website lines | `contactInfo[]` |
| Checklist items (step-by-step) | `enrollmentChecklist[]` |

### LLM-assisted extraction (recommended for complex documents)

Send the markdown to Claude with a structured prompt. Use the `ExtractedBenefitsData` type as the target schema:

```
You are extracting structured data from a benefits guide.
Output a single JSON object matching the ExtractedBenefitsData type.

Confirmed plans: ${JSON.stringify(phase1.detectedPlans)}
Chapter list: ${phase1.chaptersList.join(', ')}

Rules:
- companyName: from the document title or first heading
- For each benefit chapter (## heading), create one ExtractedChapter
- Assign the correct BenefitCategory from: eligibility, overview, medical, dental, ...
- For each markdown table, create one ExtractedTable inside the chapter
- cells[] must have the same length as columns[] and in the same order
- Use isSection: true for category-header rows, not data rows
- sections[].isList = true when the content is a bullet list

Document:
<markdown content>
```

Parse and validate the JSON response before writing.

## Output

Write to `content/<slug>-extracted.json` (UTF-8, pretty-printed):

```typescript
fs.writeFileSync(
  `content/${slug}-extracted.json`,
  JSON.stringify(extractedData, null, 2),
  'utf-8'
)
```

Verify before saving:
- `companyName` is a non-empty string
- `chapters` is a non-empty array
- Each chapter has `title`, `category`, and `contentParagraphs`
- `detectedPlans` has at least one plan in `medicalPlans`, `dentalPlans`, or `visionPlans`
- All table `cells[]` arrays match their `columns[]` length

## Next step

Hand the output to the `microsite-from-template` skill:
> "Create a microsite from `content/premier-america-extracted.json`"
