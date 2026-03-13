# CLAUDE.md — RS&H Hub / Benefits Portal

## 1. Project Overview
A multi-tenant benefits portal and management system that allows administrators to import employer benefits from PDF guides using AI-driven extraction (LlamaExtract) and serves branded benefit portals for specific employers via subdomains or query parameters.

## 2. Tech Stack
| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| Framework | Next.js (App Router) | 16.1.6 | Core web framework |
| Language | TypeScript | 5.7.3 | Type-safe development |
| Styling | Tailwind CSS | 4.1.13 | Utility-first styling with typography plugin |
| UI | Radix UI | Latest | Accessible UI primitives |
| Icons | Lucide React | 0.544.0 | Vector icons |
| Storage | Supabase Storage | 2.47.0 | PDF and logo asset storage |
| AI | LlamaCloud/LlamaExtract | API | PDF parsing and structured data extraction |
| CMS | Local Sanity (JSON) | Custom | Local-first content management using JSON files |
| Deployment| Vercel | Production | Infrastructure and hosting |

## 3. Repository Structure
```
rsandh-hub/
├── app/                    # Next.js App Router routes and layouts
│   ├── (employer)/         # Multi-tenant benefit portal pages (Branded)
│   ├── admin/              # Global and client-specific admin dashboard
│   └── api/                # Backend API endpoints (Import, Content)
├── components/             # Reusable React components (Portal & Admin)
├── content/                # Local JSON data storage (published content)
├── hooks/                  # Custom React hooks
├── lib/                    # Core business logic and integrations
│   ├── benefits-import/    # AI extraction, mapping, and transformation
│   ├── content/            # Local content fetching and management
│   └── supabase/           # Storage helpers for PDFs and images
├── public/                 # Static assets
├── scripts/                # Verification and seeding scripts
├── styles/                 # Global CSS and Tailwind configuration
├── next.config.mjs         # Next.js configuration (Body limits, maxDuration)
└── proxy.ts                # Middleware for multi-tenant routing and auth
```

## 4. Screens / Routes / Pages
| Screen | File Path | Route/DeepLink | Purpose | Key Elements |
|--------|-----------|----------------|---------|--------------|
| Directory | `app/page.tsx` | `/` | List all available employers | Client list, search |
| Admin Dashboard | `app/admin/page.tsx` | `/admin` | Import PDFs and manage clients | Upload area, status list |
| Admin Login | `app/admin/login/page.tsx` | `/admin/login` | Authentication for admin access | Login form |
| Employer Portal | `app/(employer)/layout.tsx` | `{slug}.domain.com/` | Home page for a specific employer | Branding, navigation cards |
| Benefits List | `app/(employer)/benefits/page.tsx` | `/benefits` | List all benefit categories | Category cards |
| Benefit Detail | `app/(employer)/benefits/[slug]/page.tsx` | `/benefits/[slug]`| Detailed info for a specific benefit | Rich text content, tables |
| Contacts | `app/(employer)/contacts/page.tsx` | `/contacts` | Key contact information | Contact cards |
| Document Hub | `app/(employer)/document-hub/page.tsx` | `/document-hub` | Access to benefits guide and forms | PDF viewer link, lists |
| Enrollment Checklist | `app/(employer)/enrollment-checklist/page.tsx` | `/enrollment-checklist`| Steps for enrollment | Checklist items |
| Retirement Planning | `app/(employer)/retirement-planning/page.tsx` | `/retirement-planning`| Specialized retirement info | Planning sections |

## 5. API Endpoints
| Endpoint | Method | Purpose | Key Request Fields | Key Response Fields |
|----------|--------|---------|--------------------|---------------------|
| `/api/benefits-import` | POST | Phase 1: Upload PDF & detect plans | `file`, `clientSlug`, `logo` | `plans`, `fileAssetId`, `success` |
| `/api/benefits-import/phase2` | POST | Phase 2: Extract & Save | `fileAssetId`, `confirmedPlans` | `success`, `chaptersCount` |
| `/api/content` | GET | Fetch parsed employer JSON | `employer` (slug) | Sanity-compatible payload |
| `/api/content/list` | GET | List all local content files | - | Array of client slugs |

## 6. Database Schema
*   **Storage (Supabase)**: `employer-assets` bucket.
    *   Path: `{clientSlug}/benefits-guide.pdf`
    *   Path: `{clientSlug}/logo.png`
*   **Content (Local JSON)**: `content/{clientSlug}.published.json`.
    *   Follows a schema mapping to Sanity Portable Text and custom models defined in `lib/content/types.ts`.

## 7. Key Data Flows
1.  **Benefits Import (Phase 1)**: User uploads PDF -> App uploads to Supabase -> Calls LlamaExtract for plan detection -> Returns detected categories for review.
2.  **Benefits Import (Phase 2)**: User confirms plans -> App downloads PDF from Supabase -> Calls LlamaExtract for detailed extraction -> Transforms to Sanity JSON -> Saves locally.
3.  **Multi-Tenant Rendering**: User visits `rs-h.domain.com` -> `proxy.ts` extracts `rs-h` -> Passes `x-employer-slug` header -> Pages load `content/rs-h.published.json`.

## 8. Services & Key Functions
*   `lib/benefits-import/extract.ts`: Core LlamaExtract interaction logic.
*   `lib/benefits-import/transform.ts`: Mapping logic between AI output and local schema.
*   `lib/supabase/storage.ts`: Handles file uploads/downloads with auto-retry.
*   `lib/content/index.ts`: Load/Save/Publish local JSON content.

## 9. Environment Variables
| Variable | Purpose | Required? |
|----------|---------|-----------|
| `LLAMA_CLOUD_API_KEY` | Authentication for PDF extraction | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for storage (bypasses RLS) | Yes |
| `ADMIN_TOKEN` | Secret for `/admin` routes | Yes |
| `NEXT_PUBLIC_DEFAULT_EMPLOYER`| Fallback employer slug | No |

## 10. Commands
```bash
# Install dependencies
npm install

# Run dev server (Turbopack)
npm run dev

# Build for production
npm run build

# Verify Supabase configuration
npx tsx scripts/test-supabase-upload.ts
```

## 11. Coding Patterns
*   **Routing**: Uses Next.js App Router with Route Group `(employer)` for shared multi-tenant layout.
*   **State**: Server-side data fetching with client-side interactivity using Radix components.
*   **Validation**: Zod schemas for API request validation.
*   **Multi-tenancy**: Middleware-based (`proxy.ts`) slug extraction from subdomains.
*   **Error Handling**: Centralized logging in API routes with try/catch blocks.

## 12. Gotchas & Traps
1.  **Body Size Limit**: Next.js/Middleware default is 10MB. It is explicitly increased to **50MB** in `next.config.mjs` to handle large PDFs.
2.  **Server Timeout**: Vercel Hobby plan has a **300s** limit for `maxDuration`. API routes must not exceed this.
3.  **Subdomain Deployment**: Wildcard subdomains (e.g., `*.domain.com`) must be configured in Vercel and DNS for multi-tenancy to work.
4.  **Local Storage on Vercel**: `content/` is read-only at runtime on Vercel. New imports generate JSON files which must be committed to Git to be reflected in production.
5.  **Environment Sync**: `proxy.ts` requires `BASE_DOMAINS` to be updated when deploying to a new custom domain.

## 13. Reject List
| Never Do This | Do This Instead |
|---------------|-----------------|
| Use simple `fetch` for large uploads | Use `uploadPdf` helper with retry logic |
| Hardcode employer slugs in pages | Use `x-employer-slug` header or query params |
| Store PDFs locally | Always use Supabase for persistent assets |
| Expose service role key on client | Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only |
