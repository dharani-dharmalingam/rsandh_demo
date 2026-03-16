import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getPublishedContent,
  getDraftContent,
  saveContent,
  publishContent,
  hasDraft,
  employerExists,
} from "@/lib/content";
import type { EmployerContent } from "@/lib/content/types";
import { isSupabaseConfigured } from "@/lib/supabase/storage";
import {
  getDraft as getDraftFromTable,
  hasDraftInTable,
  upsertDraft,
  markPublished,
} from "@/lib/supabase/content-store";
import { commitContentToGit } from "@/lib/git-commit";

function getSlug(request: NextRequest): string | null {
  return (
    request.headers.get("x-employer-slug") ??
    request.nextUrl.searchParams.get("employer") ??
    null
  );
}

const isServerless = () =>
  process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");

export async function GET(request: NextRequest) {
  const slug = getSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Missing employer slug" }, { status: 400 });
  }

  const mode = request.nextUrl.searchParams.get("mode") || "published";

  // When employer has no content yet, return slug so admin can show Import tab
  if (!employerExists(slug)) {
    return NextResponse.json({
      data: null,
      hasDraft: false,
      mode,
      slug,
    });
  }

  try {
    let data: EmployerContent;
    let hasDraftFlag: boolean;

    if (mode === "draft" && isServerless() && isSupabaseConfigured()) {
      const tableDraft = await getDraftFromTable(slug);
      if (tableDraft != null) {
        data = tableDraft as EmployerContent;
        hasDraftFlag = true;
      } else {
        data = getPublishedContent(slug);
        hasDraftFlag = await hasDraftInTable(slug);
      }
    } else if (mode === "draft") {
      data = getDraftContent(slug);
      hasDraftFlag = hasDraft(slug);
    } else {
      data = getPublishedContent(slug);
      hasDraftFlag = isServerless() && isSupabaseConfigured()
        ? await hasDraftInTable(slug)
        : hasDraft(slug);
    }

    return NextResponse.json({
      data,
      hasDraft: hasDraftFlag,
      mode,
      slug,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const slug = getSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Missing employer slug" }, { status: 400 });
  }

  const action = request.nextUrl.searchParams.get("action");
  const body = (await request.json()) as EmployerContent | null;

  try {
    if (action === "publish") {
      if (!body) {
        return NextResponse.json(
          { error: "Publish requires content in request body" },
          { status: 400 }
        );
      }
      if (isServerless() && isSupabaseConfigured()) {
        const result = await commitContentToGit(slug, body);
        if (!result.success) {
          return NextResponse.json(
            { error: result.message },
            { status: 500 }
          );
        }
        await markPublished(slug, body);
        return NextResponse.json({
          success: true,
          message:
            result.message ||
            "Published successfully; deployment will run automatically.",
        });
      }
      saveContent(slug, body);
      publishContent(slug);
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true, message: "Published successfully" });
    }

    // Save draft
    if (!body) {
      return NextResponse.json(
        { error: "Save draft requires content in request body" },
        { status: 400 }
      );
    }
    if (isServerless() && isSupabaseConfigured()) {
      await upsertDraft(slug, body);
      return NextResponse.json({ success: true, message: "Draft saved" });
    }
    saveContent(slug, body);
    return NextResponse.json({ success: true, message: "Draft saved" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const slug = getSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Missing employer slug" }, { status: 400 });
  }

  try {
    const patch = (await request.json()) as Partial<EmployerContent>;
    let current: EmployerContent;

    if (isServerless() && isSupabaseConfigured()) {
      const tableDraft = await getDraftFromTable(slug);
      current = (tableDraft ?? getPublishedContent(slug)) as EmployerContent;
    } else {
      current = getDraftContent(slug);
    }
    const merged = { ...current, ...patch } as EmployerContent;

    if (isServerless() && isSupabaseConfigured()) {
      await upsertDraft(slug, merged);
    } else {
      saveContent(slug, merged);
    }
    return NextResponse.json({ success: true, message: "Draft patched" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
