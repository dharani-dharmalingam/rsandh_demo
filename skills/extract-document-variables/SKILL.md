---
name: extract-document-variables
description: Extract structured variables from the parsed markdown stored in Supabase. Use this skill whenever the user wants to pull named fields from a parsed benefits guide — company name, plan names, benefit chapters, contact info, premium tables, etc. — to feed the microsite pipeline. Trigger on any mention of "extract variables", "extract for <slug>", "parse into JSON", "get fields from document", "structured extraction", or as the second step after pdf-to-markdown-llamaparse.
---

# Skill 2 — Extract Document Variables

**Pipeline role:** Second step. Reads the parsed markdown from `parsed_documents`, performs two-phase extraction (Claude does this directly), and saves the result to `extracted_documents`.

## Pipeline context

```
parsed_documents table: { slug, markdown }
     ↓  [this skill — GET /api/pipeline/parsed + POST /api/pipeline/parsed]
extracted_documents table: { slug, extracted_data }
     ↓
Skill 3: microsite-from-template
```

---

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

#### 2. Detect structure from markdown

Scan the markdown and extract:

- `companyName` → first `# Heading` or "Company: …" line near the top
- `medicalPlans` → column headers in tables under "Medical" section (e.g. "PPO", "HDHP", "Base Copay", "Buy-Up Copay")
- `dentalPlans` → column headers in dental tables (e.g. "DPPO", "Dental PPO")
- `visionPlans` → column headers in vision tables (e.g. "Vision Plan", "VSP")
- `premiumTiers` → row labels in premium tables (e.g. "Employee Only", "Employee + Spouse", "Employee + Child(ren)", "Family") — extract EXACTLY as written
- `chaptersList` → every `##` heading title
- `themeColor` → hex color if found in text, otherwise null

#### 3. Show Phase 1 checkpoint

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

## Phase 2 — Full Extraction (Template-Guided)

With the confirmed plan names and chapter list, extract the complete `ExtractedBenefitsData`.

Use the chapter-type guides below to know exactly which fields to extract for each section. Do NOT skip any field if the content exists in the markdown. Every paragraph, bullet list, definition box, callout, and table must be captured.

---

### Global fields (always extract)

```
companyName: string          — company name confirmed in Phase 1
themeColor?: string          — hex color or null
contactInfo: [               — ALL phone/website/email lines in the document
  { label, value, href?, groupNumber? }
]
enrollmentChecklist?: [      — step-by-step enrollment instructions if present
  { title, description }
]
benefitChanges?: [           — "new for 2025" or "updated" items if present
  { type: "new"|"update", title, description }
]
detectedPlans: {             — confirmed from Phase 1
  medicalPlans, dentalPlans, visionPlans, premiumTiers
}
```

---

### Chapter-Type Extraction Rules

For each chapter in the document, use the matching guide below. The `chapters[]` array in the final JSON must include EVERY chapter found.

---

#### ELIGIBILITY chapter (`category: "eligibility"`)

```
contentParagraphs: string[]     — ALL intro paragraphs about who is eligible

eligibilityRequirements: string[]
  — Bullet points listing eligibility criteria
  — e.g. "Full-time employees working 30+ hours/week"
  — e.g. "Coverage effective 1st of month following 60 days"

eligibleDependents: string[]
  — Who qualifies as a dependent (spouse, children under 26, domestic partners)

enrollmentPoints: string[]
  — Key enrollment info: open enrollment windows, new hire timelines
  — e.g. "This is an ACTIVE enrollment — elections do not roll over"

qleDescription: string
  — Introductory sentence about Qualifying Life Events (QLE)

qleImportantNotice: string
  — Critical deadline notice e.g. "You have 30 days from a qualifying event"

commonQualifyingEvents: string[]
  — Standard events: marriage, birth/adoption, divorce, loss of other coverage

lesserKnownQualifyingEvents: string[]
  — Less obvious events: death of dependent, child reaching age 26, spouse job change
```

Map all of the above into a single chapter object:
```json
{
  "title": "Eligibility",
  "category": "eligibility",
  "description": "1-2 sentence summary",
  "contentParagraphs": [ "...all paragraphs..." ],
  "sections": [
    { "title": "Qualifying Life Events", "paragraphs": ["..."] },
    { "title": "Eligible Dependents", "paragraphs": ["..."] }
  ]
}
```

---

#### MEDICAL chapter (`category: "medical"`)

For each medical plan (HDHP, PPO, Base Copay, Buy-Up Copay, etc.) extract a **separate chapter** OR combine into one chapter with a plan-comparison table.

```
contentParagraphs: string[]
  — Intro paragraphs about medical coverage, provider network, how to find doctors
  — e.g. "Medical coverage is provided by UHC, available nationwide"
  — e.g. "In-network vs out-of-network explanation"
  — e.g. "ALEX benefits counselor info if present"
  — e.g. "Pharmacy benefits description"
  — e.g. "Virtual visit info"

tables[]:
  — ONE table per logical group:

  Table 1: "Medical Plan Comparison" (deductibles, OOP max, coinsurance, copays)
    columns: [{ key: "benefit", label: "Benefit" }, { key: "plan1", label: "{PlanName}" }, ...]
    rows: extract EVERY row including:
      — Annual Deductible (Single, Family)
      — Coinsurance (Plan Pays)
      — Annual Out-of-Pocket Maximum (Single, Family)
      — Primary Care (copay or coinsurance)
      — Specialist Services
      — Outpatient / Inpatient
      — Urgent Care
      — Emergency Room
      — Preventive Care
      — Virtual Visits / Teladoc
      — Convenience / Retail Clinic
      — Labs / X-Rays / Imaging
      — Mental Health / Substance Abuse (if present)
      Use isSection: true for category header rows (e.g. "ANNUAL DEDUCTIBLE")

  Table 2: "Prescription Drug Copays"
    rows: Tier 1, Tier 2, Tier 3, Mail Order (label each as "2.5x" or "$X")
    Note: Mark with *After deductible if applicable

  Table 3: "Bi-Weekly Premium Contributions"
    columns: [{ key: "tier", label: "Coverage Tier" }, per-plan columns]
    rows: Employee Only, Employee + Spouse, Employee + Child(ren), Employee + Family
```

---

#### DENTAL chapter (`category: "dental"`)

```
contentParagraphs: string[]
  — ALL text ABOVE the dental table: provider name, intro sentences
  — e.g. "LEHR offers affordable dental plan options through UHC"
  — e.g. "Employees may purchase dental insurance on a voluntary basis"
  — Include footnotes (*After deductible) as final paragraph

tables[]:
  Table 1: "Dental Bi-Weekly Contributions"
    rows: Employee Only, Employee + Spouse, Employee + Child(ren), Employee + Family

  Table 2: "{PlanName} Coverage" (e.g. "DPPO Coverage")
    columns: Service | In-Network | Out-of-Network
    rows: (use isSection:true for section headers)
      — Annual Deductible (Individual, Family)
      — Annual Maximum (Per Person)
      — Preventive Services (Oral Exams, Cleanings, Fluoride, Sealants) — include description in label
      — Basic Services (Fillings, Oral Surgery, Extractions) — include description in label
      — Major Services (Root Canal, Crowns, Dentures, Bridges, Periodontics) — include description in label
      — Orthodontia (if present)
```

---

#### VISION chapter (`category: "vision"`)

```
contentParagraphs: string[]
  — ALL text ABOVE the vision table
  — e.g. "LEHR offers comprehensive vision coverage through UHC"
  — Include footnotes (*Fitting/Evaluation fee applied...) as final paragraph

tables[]:
  Table 1: "Vision Bi-Weekly Contributions"
    rows: Employee Only, Employee + Spouse, Employee + Child(ren), Employee + Family

  Table 2: "Vision Coverage Details"
    columns: Service | In-Network | Out-of-Network | Frequency
    rows: (use isSection:true for EXAMS, LENSES, CONTACTS, FRAMES headers)
      — Exams: Copay
      — Lenses: Single Vision, Bifocal, Trifocal
      — Contacts: Fitting & Evaluation, Elective, Medically Necessary
      — Frames: Copay, Allowance
```

---

#### HEALTH SAVINGS ACCOUNT / FSA-HSA chapter (`category: "hsa"` or `"fsa-hsa"`)

```
contentParagraphs: string[]
  — ALL definition/explanation paragraphs about HSA/FSA:
  — "With an HSA, contributions and withdrawals for qualified expenses are tax-free"
  — "Must be enrolled in HDHP to contribute"
  — "Funds roll over year to year"
  — FSA definition paragraph if present
  — "Use it or lose it" rules for FSA

tables[]:
  Table: "Annual HSA/FSA Contribution Limits"
    rows: Individual, Family, Catch-Up Contribution (Ages 55+)

  Table (if present): "Employer HSA Contribution"
    columns per plan tier

  Table (if present): "FSA Types Comparison"
    columns: Healthcare FSA | Limited Purpose FSA | Dependent Care FSA
    rows: Who can contribute, Annual limit, Eligible expenses, Carryover rules
```

---

#### EAP chapter (`category: "eap"`)

```
contentParagraphs: string[]
  — Provider name and phone number
  — "Available 24/7 by phone, in-person, and web"
  — Number of free visits e.g. "Six free sessions per incident at no cost"
  — Full description of what the EAP program covers

sections[]:
  — { title: "EAP Services", paragraphs: ["list of covered services..."], isList: true }
    Services typically include: Anxiety, Depression, Grief, Addiction, Financial planning,
    Legal consultation, Child/elder care, Adoption, Cancer support, Work-life balance
```

---

#### LIFE INSURANCE / SURVIVOR BENEFITS chapter (`category: "life-insurance"`)

```
contentParagraphs: string[]
  — "Company provides Basic Life and AD&D insurance of $X,000 automatically"
  — "Full-time employees receive coverage even if they waive other benefits"
  — AD&D description paragraph
  — Voluntary Life amounts, increments, and EOI thresholds for employee/spouse/child
  — Age reduction schedule (e.g. "65% at age 65, 50% at age 70")
  — Voluntary AD&D and Child Life flat rates

tables[]:
  Table: "Voluntary Life Insurance Rates (per $1,000/month)"
    columns: Age Range | Employee/Spouse Rate
    rows: Under 35, 35-39, 40-44, 45-49, 50-54, 55-59, 60-64, 65-69, 70-74, 75+
```

---

#### DISABILITY / INCOME PROTECTION chapter (`category: "disability"`)

```
contentParagraphs: string[]
  — Intro: "Company offers disability coverage to protect income during illness or injury"
  — STD summary: "60% of income up to $X/week, X-day elimination period, X weeks max"
  — LTD summary: "60% of income up to $X/month, 90-day elimination period, until SSNRA"

tables[]:
  Table: "STD/LTD Rates by Age" (if age-banded rates exist)
    columns: Age Range | STD Rate | LTD Rate
    rows: Under 25, 25-29, 30-34 ... 70+

  Table: "STD Plan Details" (if benefit comparison table exists)
    rows: Your cost, When benefits begin, Benefit amount, Duration

  Table: "LTD Plan Details" (if present)
    rows: Monthly maximum, Elimination period, Benefit duration
```

---

#### SUPPLEMENTAL HEALTH chapter (`category: "supplemental"`)

```
contentParagraphs: string[]
  — Provider name
  — Intro about critical illness and accident insurance
  — Payment mechanics ("lump sum paid directly to you")

sections[]:
  — { title: "Critical Illness — Covered Conditions", paragraphs: [...], isList: true }
    e.g. Cancer, Heart Attack, Stroke, Major Organ Transplant, Paralysis

tables[]:
  Table: "Critical Illness Benefit Amounts"
    rows: Coverage tiers with benefit amounts (e.g. $10,000 / $20,000)

  Table: "Accident Insurance Payouts"
    rows: Urgent Care/X-Ray, Fracture, Dislocation, Concussion, Burn, Ambulance, Hospital

  Table: "Accident Employee Contributions"
    rows: Employee Only, Employee + Spouse, Family — bi-weekly costs
```

---

#### PAID TIME OFF chapter (`category: "paid-time-off"`)

```
contentParagraphs: string[]
  — Intro about PTO/vacation policy

sections[]:
  — { title: "Observed Holidays", paragraphs: [...list of holidays...], isList: true }
  — { title: "Floating Holiday", paragraphs: ["...explanation..."] }
  — { title: "Paid Parental Leave", paragraphs: ["...up to X weeks..."] }
  — { title: "Bereavement Leave", paragraphs: ["..."] }
  — { title: "Jury Duty", paragraphs: ["..."] }

tables[]:
  Table: "Vacation Accrual by Years of Service"
    rows: Year brackets (e.g. "Less than 1 year", "1-3 years") with days/hours
```

---

#### VOLUNTARY BENEFITS chapter (`category: "voluntary-benefits"`)

```
contentParagraphs: string[]
  — Overview sentence about additional voluntary benefit options

tabs[]:  (use if multiple distinct sub-benefits are presented)
  Each tab:
  — title: short name (Pet Insurance, Auto & Home, Identity Protection, Legal Plan)
  — contentParagraphs: provider name + about paragraph + how to enroll
  — link/linkLabel if enrollment URL is provided
```

---

#### DYNAMIC chapters — all other sections (`category: from list below`)

For ANY section NOT covered above (Retirement/401k, Financial Wellbeing, Wellness, College Savings, Other):

```
title: string          — standardized name
category: string       — one of: retirement, wellness, college-savings, other
description: string    — 1-2 sentence summary
contentParagraphs: string[]  — ALL paragraph text, definition boxes, callout text
sections[]:            — sub-sections if the chapter has headings
  { title, paragraphs: string[], isList?: boolean }
tables[]:              — ALL tables exactly as they appear
  { tableTitle, columns[], rows[] }
```

---

### Validation before saving

- `companyName` is a non-empty string
- `chapters` array has at least one entry
- Every chapter has `title`, `category`, and `contentParagraphs` (not empty)
- All table `cells[]` arrays match their `columns[]` length exactly
- `detectedPlans` has at least one plan in `medicalPlans`, `dentalPlans`, or `visionPlans`
- `contactInfo[]` has at least one entry (HR contact is always present)

---

### Save Phase 2

After extracting, save via:

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
> - **Contact entries:** {contactInfo.length}
>
> Does this look right? If yes, say: **"publish {slug}"**

Wait for the user to confirm before triggering Skill 3.

---

## What's stored

| Table | Column | Value |
|---|---|---|
| `extracted_documents` | `slug` | employer slug (PK) |
| `extracted_documents` | `extracted_data` | full `ExtractedBenefitsData` JSONB |

## Next step

Once the user confirms:
> "publish {slug}"

This triggers Skill 3 (`microsite-from-template`).
