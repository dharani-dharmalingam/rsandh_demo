import { NextResponse } from "next/server";
import { listEmployers, getPublishedContent } from "@/lib/content";

/**
 * GET /api/content/list
 * Returns all employers (slug + name) for the global admin Clients tab.
 * No auth required for listing; edit operations remain protected.
 */
export async function GET() {
  try {
    const slugs = listEmployers();
    const employers = slugs.map((slug) => {
      try {
        const content = getPublishedContent(slug);
        return { slug, name: content.client?.name ?? slug };
      } catch {
        return { slug, name: slug };
      }
    });

    return NextResponse.json({ employers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to list employers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
