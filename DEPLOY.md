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

---

## How to check subdomain-per-employer (after deploy)

1. **Domain setup**
   - In Vercel **Settings → Domains**: add your domain (e.g. `benefits.acolyteai.com`) and the wildcard `*.benefits.acolyteai.com`.
   - In DNS: add the CNAME Vercel shows for `*.benefits.acolyteai.com` (e.g. to `cname.vercel-dns.com`). Wait for propagation.

2. **Test without subdomain (directory or default)**
   - Open `https://benefits.acolyteai.com` (or your domain).
   - You should see either the **employer directory** (list of clients) or, if `NEXT_PUBLIC_DEFAULT_EMPLOYER` is set, that employer’s home page.

3. **Test with subdomain (per-employer site)**
   - Open `https://<slug>.benefits.acolyteai.com` where `<slug>` is an employer that has content (e.g. `rs-h`, `premier-america`).
   - Example: `https://rs-h.benefits.acolyteai.com` → should show that employer’s benefits portal (home, benefits, contacts, etc.).
   - Try another: `https://premier-america.benefits.acolyteai.com` → should show Premier America’s content.

4. **Test admin per client**
   - `https://benefits.acolyteai.com/admin?token=YOUR_ADMIN_TOKEN` → global admin (Clients + Import).
   - `https://rs-h.benefits.acolyteai.com/admin?token=YOUR_ADMIN_TOKEN` → admin for that employer (or login at `/admin/login` and use `?employer=rs-h`).

5. **If you only have the default Vercel URL**
   - Subdomains like `rs-h.yourapp.vercel.app` require a **custom domain** with a wildcard in Vercel. The default `*.vercel.app` URL does not support this.
   - You can still test employer context with query param: `https://yourapp.vercel.app?employer=rs-h` and `https://yourapp.vercel.app/admin?employer=rs-h&token=YOUR_ADMIN_TOKEN`.
