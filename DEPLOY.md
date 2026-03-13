# Deploy to Vercel + Subdomain per Employer

## 1. Supabase

- **Bucket:** `employer-assets` must exist and be **public** (Storage → employer-assets → make public).
- **Env (Vercel):** Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Settings → API in Supabase).

## 2. Vercel project

- Connect the repo to Vercel; build command: `next build`; output: Next.js.
- Add environment variables in Vercel (Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (secret) |
| `ADMIN_TOKEN` | Secret token for /admin access |
| `LLAMA_CLOUD_API_KEY` | For PDF extraction |
| `NEXT_PUBLIC_DEFAULT_EMPLOYER` | Optional: default employer when no subdomain (e.g. `rs-h`) |

## 3. Subdomain per employer

- In Vercel: **Settings → Domains** add your base domain, e.g. `benefits.acolyteai.com`.
- Add a **wildcard** domain: `*.benefits.acolyteai.com` (so `rs-h.benefits.acolyteai.com`, `premier-america.benefits.acolyteai.com`, etc. resolve to the same app).
- In your DNS (wherever `benefits.acolyteai.com` is managed), add:
  - **A/CNAME** for `*.benefits.acolyteai.com` → Vercel (Vercel will show the target).
- Update **proxy.ts** so `BASE_DOMAINS` / subdomain logic uses your real domain. Currently it uses `benefits.acolyteai.com` and `localhost`. If your domain is different, change the constant in `proxy.ts`.

## 4. Content on Vercel

- The app reads content from **local JSON files** (`content/*.published.json`) in the repo. So whatever is in the repo at build time is what the site serves.
- For persistent content edits on Vercel you’d need to move content to Supabase (or another store) later; for now, content is from the repo and PDFs/logos are in Supabase.

## 5. Verify

- **Global admin:** `https://benefits.acolyteai.com/admin` (no subdomain) → Clients list + Import.
- **Client portal:** `https://rs-h.benefits.acolyteai.com` → RS&H benefits site.
- **Client admin:** `https://rs-h.benefits.acolyteai.com/admin` or `https://benefits.acolyteai.com/admin?employer=rs-h` → Editor for that client.
