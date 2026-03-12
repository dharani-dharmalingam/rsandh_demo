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

function getSlug(request: NextRequest): string | null {
  return (
    request.headers.get("x-employer-slug") ??
    request.nextUrl.searchParams.get("employer") ??
    null
  );
}

export async function GET(request: NextRequest) {
  const slug = getSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Missing employer slug" }, { status: 400 });
  }

  if (!employerExists(slug)) {
    return NextResponse.json({ error: `Employer "${slug}" not found` }, { status: 404 });
  }

  const mode = request.nextUrl.searchParams.get("mode") || "published";

  try {
    const data =
      mode === "draft" ? getDraftContent(slug) : getPublishedContent(slug);

    return NextResponse.json({
      data,
      hasDraft: hasDraft(slug),
      mode,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const slug = getSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Missing employer slug" }, { status: 400 });
  }

  const action = request.nextUrl.searchParams.get("action");

  try {
    if (action === "publish") {
      publishContent(slug);
      revalidatePath("/", "layout");
      return NextResponse.json({ success: true, message: "Published successfully" });
    }

    const body = (await request.json()) as EmployerContent;
    saveContent(slug, body);

    return NextResponse.json({ success: true, message: "Draft saved" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const slug = getSlug(request);
  if (!slug) {
    return NextResponse.json({ error: "Missing employer slug" }, { status: 400 });
  }

  try {
    const current = getDraftContent(slug);
    const patch = await request.json();

    const merged = { ...current, ...patch } as EmployerContent;
    saveContent(slug, merged);

    return NextResponse.json({ success: true, message: "Draft patched" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
