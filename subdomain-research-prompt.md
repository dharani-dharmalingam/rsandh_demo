# Research Prompt: Setting up Dynamic Subdomains on Vercel

If you are using an AI like Perplexity to research how to set up subdomains for this project, copy and paste the detailed prompt below. It includes our specific tech stack and requirements to ensure you get the most accurate advice.

---

### **Perplexity Research Prompt**

**Context:**
I am building a multi-tenant web application and I need to set up dynamic subdomains (e.g., `client1.example.com`, `client2.example.com`) that point to a single Next.js deployment.

**Tech Stack:**
*   **Framework:** Next.js (App Router, version 16.x/latest)
*   **Deployment:** Vercel
*   **Language:** TypeScript
*   **Persistence:** Local JSON files for content metadata, Supabase for image/PDF storage.
*   **Multi-tenancy Logic:** Handled via Next.js Middleware (`middleware.ts` / `proxy.ts`) which extracts the `employer-slug` from the hostname.

**Current Setup:**
We have a file called `proxy.ts` (invoked by `middleware.ts`) that checks if the incoming `host` matches a base domain (like `benefits.acolyteai.com`). If it does, it extracts the subdomain and sets a custom header `x-employer-slug`. If visited via a generic Vercel URL (like `my-app.vercel.app`), it falls back to query parameters or cookies.

**Key Requirement:**
I want to move from using query parameters (`?employer=rs-h`) to using professional subdomains (`rs-h.benefits.acolyteai.com`).

**Research Questions:**
1.  **Vercel Configuration:** How do I configure Vercel to accept all subdomains for a specific custom domain (Wildcard Domains)? What are the steps in the Vercel dashboard?
2.  **DNS Setup:** What CNAME or A records do I need to add to my DNS provider (e.g., GoDaddy, Cloudflare) to support dynamic subdomains with Vercel?
3.  **SSL/HTTPS:** Does Vercel automatically handle SSL certificates for dynamic wildcard subdomains, or do I need a specific plan or configuration?
4.  **Middleware Optimization:** In Next.js App Router, what is the best practice for rewriting the URL internally so that the user sees `client.example.com/login` but the server renders the code located at `/app/(employer)/login/page.tsx`?
5.  **Local Development:** How can I test subdomains locally on Windows (modifying `hosts` file vs. tools like `lvh.me`)?

Please provide a step-by-step guide for both the Vercel Dashboard and the code adjustments needed.

---
